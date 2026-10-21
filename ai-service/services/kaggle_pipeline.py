"""
Kaggle Data Integration Pipeline for MAROC-LOC

Downloads, cleans, and merges external real estate datasets into the platform.
Datasets used:
1. Morocco Real Estate Listings (price prediction baseline)
2. Housing Prices - Global (feature normalization)
3. French/Arabic NLP corpora (embedding fine-tuning data)
4. Synthetic/user-generated fraud labels (from platform)

Pipeline stages:
Download → Validate Schema → Clean → Feature Engineer → Deduplicate →
→ Merge with Platform Data → Train/Test Split → Model Retraining Trigger
"""

import os
import logging
from typing import Optional, List, Dict
from dataclasses import dataclass
from datetime import datetime

import pandas as pd
import numpy as np

# Optional Kaggle API
try:
    import kaggle
    KAGGLE_API_AVAILABLE = True
except ImportError:
    KAGGLE_API_AVAILABLE = False

logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "kaggle")
os.makedirs(DATA_DIR, exist_ok=True)


@dataclass
class DatasetConfig:
    name: str
    kaggle_ref: str
    filename: str
    purpose: str
    refresh_days: int


# Recommended Kaggle datasets for Moroccan real estate AI
RECOMMENDED_DATASETS = [
    DatasetConfig(
        name="Morocco Real Estate",
        kaggle_ref="ahmedmohamed200/morocco-real-estate",
        filename="morocco_real_estate.csv",
        purpose="price_baseline",
        refresh_days=30
    ),
    DatasetConfig(
        name="Global Housing Prices",
        kaggle_ref="",
        filename="housing_prices_global.csv",
        purpose="normalization",
        refresh_days=90
    ),
    DatasetConfig(
        name="Darija Sentiment",
        kaggle_ref="",
        filename="darija_sentiment.csv",
        purpose="nlp_training",
        refresh_days=60
    ),
]


class KaggleDataPipeline:
    """
    Production data pipeline for external dataset integration.
    """

    def __init__(self, db_connection_string: Optional[str] = None):
        self.db_connection_string = db_connection_string
        self.raw_dir = os.path.join(DATA_DIR, "raw")
        self.processed_dir = os.path.join(DATA_DIR, "processed")
        os.makedirs(self.raw_dir, exist_ok=True)
        os.makedirs(self.processed_dir, exist_ok=True)

    def download_dataset(self, config: DatasetConfig, force: bool = False) -> str:
        """Download dataset from Kaggle or use local cache."""
        local_path = os.path.join(self.raw_dir, config.filename)

        if os.path.exists(local_path) and not force:
            logger.info(f"Using cached dataset: {local_path}")
            return local_path

        if not KAGGLE_API_AVAILABLE:
            logger.warning("Kaggle API not installed. Please install with: pip install kaggle")
            logger.warning(f"Expected manual download at: {local_path}")
            return local_path

        try:
            logger.info(f"Downloading {config.name} from Kaggle...")
            kaggle.api.dataset_download_files(
                config.kaggle_ref,
                path=self.raw_dir,
                unzip=True,
                quiet=False
            )
            logger.info(f"Download complete: {config.name}")
            return local_path
        except Exception as e:
            logger.error(f"Failed to download {config.name}: {e}")
            return local_path

    def clean_morocco_real_estate(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Clean and standardize Moroccan real estate dataset.
        Expected columns: city, neighborhood, type, surface, rooms, price, etc.
        """
        logger.info(f"Cleaning dataset with {len(df)} rows...")

        # Remove duplicates
        df = df.drop_duplicates()

        # Standardize city names
        city_mapping = {
            "casablanca": "Casablanca",
            "casa": "Casablanca",
            "rabat": "Rabat",
            "marrakech": "Marrakech",
            "marrakesh": "Marrakech",
            "tanger": "Tanger",
            "tangier": "Tanger",
            "agadir": "Agadir",
            "fes": "Fès",
            "fez": "Fès",
        }
        if "city" in df.columns:
            df["city"] = df["city"].str.lower().str.strip().map(city_mapping).fillna(df["city"].str.title())

        # Standardize property types
        type_mapping = {
            "apartment": "Appartement",
            "appartement": "Appartement",
            "villa": "Villa",
            "house": "Maison",
            "maison": "Maison",
            "riad": "Riad",
            "studio": "Studio",
            "terrain": "Terrain",
            "land": "Terrain",
        }
        if "type" in df.columns:
            df["type"] = df["type"].str.lower().str.strip().map(type_mapping).fillna(df["type"].str.title())

        # Numeric cleaning
        for col in ["price", "surface", "rooms", "bedrooms"]:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")

        # Remove extreme outliers
        if "price" in df.columns:
            q_low = df["price"].quantile(0.001)
            q_high = df["price"].quantile(0.999)
            df = df[(df["price"] >= q_low) & (df["price"] <= q_high)]

        if "surface" in df.columns:
            df = df[(df["surface"] > 5) & (df["surface"] < 5000)]

        # Calculate price per m²
        if "price" in df.columns and "surface" in df.columns:
            df["price_per_m2"] = df["price"] / df["surface"]
            # Remove impossible prices
            df = df[(df["price_per_m2"] > 500) & (df["price_per_m2"] < 50000)]

        # Add metadata
        df["data_source"] = "kaggle_morocco"
        df["ingested_at"] = datetime.now()
        df["is_training_sample"] = True

        logger.info(f"Cleaned dataset: {len(df)} rows remaining")
        return df

    def generate_synthetic_fraud_labels(self, n_legit: int = 5000, n_fraud: int = 500) -> pd.DataFrame:
        """
        Generate synthetic training data for fraud detection when real labels are scarce.
        This bootstraps the model until platform accumulates enough manual reviews.
        """
        np.random.seed(42)
        cities = list(["Casablanca", "Rabat", "Marrakech", "Tanger", "Agadir", "Fès"])

        def make_legit():
            city = np.random.choice(cities)
            surface = np.random.normal(100, 40)
            surface = max(30, surface)
            ppm2 = np.random.normal(8000, 2000)
            price = surface * ppm2
            return {
                "price": price,
                "surface": surface,
                "description_length": np.random.randint(80, 500),
                "image_count": np.random.randint(3, 12),
                "account_age_days": np.random.exponential(365) + 30,
                "listings_count": np.random.poisson(3),
                "price_per_m2": ppm2,
                "price_deviation_ratio": np.random.lognormal(0, 0.3),
                "has_contact_phone": True,
                "phone_is_moroccan": True,
                "has_contact_email": np.random.random() > 0.3,
                "email_is_suspicious": False,
                "description_sentiment": np.random.normal(0.2, 0.3),
                "image_duplicate_count": 0,
                "listing_hour": np.random.randint(8, 22),
                "ip_listing_count_24h": np.random.poisson(1),
                "device_fp_listing_count_24h": np.random.poisson(1),
                "title_template_match_score": np.random.beta(2, 5),
                "description_has_contact_info": np.random.random() > 0.7,
                "label": 0
            }

        def make_fraud():
            city = np.random.choice(cities)
            # Scam pricing: either way too low or way too high
            if np.random.random() > 0.5:
                price = np.random.choice([15000, 25000, 35000])
                surface = np.random.normal(120, 30)
            else:
                surface = np.random.normal(80, 20)
                price = surface * np.random.choice([500, 1000, 2000])

            return {
                "price": price,
                "surface": max(10, surface),
                "description_length": np.random.randint(5, 40),
                "image_count": np.random.choice([0, 0, 0, 1, 2]),
                "account_age_days": np.random.exponential(2),
                "listings_count": np.random.poisson(8),
                "price_per_m2": price / max(10, surface),
                "price_deviation_ratio": np.random.choice([0.05, 0.1, 6.0, 8.0]),
                "has_contact_phone": np.random.random() > 0.2,
                "phone_is_moroccan": np.random.random() > 0.4,
                "has_contact_email": True,
                "email_is_suspicious": np.random.random() > 0.3,
                "description_sentiment": np.random.normal(-0.3, 0.4),
                "image_duplicate_count": np.random.poisson(2),
                "listing_hour": np.random.randint(0, 24),
                "ip_listing_count_24h": np.random.poisson(12),
                "device_fp_listing_count_24h": np.random.poisson(15),
                "title_template_match_score": np.random.beta(5, 2),
                "description_has_contact_info": np.random.random() > 0.3,
                "label": 1
            }

        legit_rows = [make_legit() for _ in range(n_legit)]
        fraud_rows = [make_fraud() for _ in range(n_fraud)]
        df = pd.DataFrame(legit_rows + fraud_rows)
        logger.info(f"Generated synthetic fraud dataset: {len(df)} rows")
        return df

    def merge_with_platform_data(self, kaggle_df: pd.DataFrame, platform_df: pd.DataFrame) -> pd.DataFrame:
        """
        Merge Kaggle data with platform listings for unified training set.
        Deduplicate based on price+surface+city hash.
        """
        platform_df["data_source"] = "platform"
        platform_df["ingested_at"] = datetime.now()

        combined = pd.concat([kaggle_df, platform_df], ignore_index=True)

        # Deduplicate: same city + type + price (within 5%) + surface (within 10%)
        combined["price_bucket"] = (combined["price"] / 5000).round().astype(int) * 5000
        combined["surface_bucket"] = (combined["surface"] / 10).round().astype(int) * 10
        combined = combined.drop_duplicates(subset=["city", "type", "price_bucket", "surface_bucket"], keep="first")
        combined = combined.drop(columns=["price_bucket", "surface_bucket"], errors="ignore")

        logger.info(f"Merged dataset: {len(combined)} rows")
        return combined

    def run_full_pipeline(self, dataset_configs: Optional[List[DatasetConfig]] = None) -> Dict[str, str]:
        """Execute full ETL pipeline."""
        configs = dataset_configs or RECOMMENDED_DATASETS
        results = {}

        for config in configs:
            try:
                path = self.download_dataset(config)
                if os.path.exists(path):
                    df = pd.read_csv(path)
                    if config.purpose == "price_baseline":
                        df = self.clean_morocco_real_estate(df)
                    # Save processed
                    out_path = os.path.join(self.processed_dir, f"{config.name}_processed.parquet")
                    df.to_parquet(out_path, index=False)
                    results[config.name] = out_path
                    logger.info(f"Pipeline complete for {config.name}: {out_path}")
            except Exception as e:
                logger.error(f"Pipeline failed for {config.name}: {e}")
                results[config.name] = f"ERROR: {e}"

        return results


_pipeline: Optional[KaggleDataPipeline] = None


def get_kaggle_pipeline(db_connection_string: Optional[str] = None) -> KaggleDataPipeline:
    global _pipeline
    if _pipeline is None:
        _pipeline = KaggleDataPipeline(db_connection_string)
    return _pipeline
