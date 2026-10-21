import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_ar.dart';
import 'app_localizations_en.dart';
import 'app_localizations_fr.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
      : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('ar'),
    Locale('en'),
    Locale('fr')
  ];

  /// No description provided for @appName.
  ///
  /// In fr, this message translates to:
  /// **'MAROC-LOC'**
  String get appName;

  /// No description provided for @loading.
  ///
  /// In fr, this message translates to:
  /// **'Chargement...'**
  String get loading;

  /// No description provided for @error.
  ///
  /// In fr, this message translates to:
  /// **'Une erreur est survenue'**
  String get error;

  /// No description provided for @retry.
  ///
  /// In fr, this message translates to:
  /// **'Réessayer'**
  String get retry;

  /// No description provided for @cancel.
  ///
  /// In fr, this message translates to:
  /// **'Annuler'**
  String get cancel;

  /// No description provided for @confirm.
  ///
  /// In fr, this message translates to:
  /// **'Confirmer'**
  String get confirm;

  /// No description provided for @save.
  ///
  /// In fr, this message translates to:
  /// **'Enregistrer'**
  String get save;

  /// No description provided for @delete.
  ///
  /// In fr, this message translates to:
  /// **'Supprimer'**
  String get delete;

  /// No description provided for @edit.
  ///
  /// In fr, this message translates to:
  /// **'Modifier'**
  String get edit;

  /// No description provided for @search.
  ///
  /// In fr, this message translates to:
  /// **'Rechercher'**
  String get search;

  /// No description provided for @submit.
  ///
  /// In fr, this message translates to:
  /// **'Envoyer'**
  String get submit;

  /// No description provided for @close.
  ///
  /// In fr, this message translates to:
  /// **'Fermer'**
  String get close;

  /// No description provided for @back.
  ///
  /// In fr, this message translates to:
  /// **'Retour'**
  String get back;

  /// No description provided for @next.
  ///
  /// In fr, this message translates to:
  /// **'Suivant'**
  String get next;

  /// No description provided for @previous.
  ///
  /// In fr, this message translates to:
  /// **'Précédent'**
  String get previous;

  /// No description provided for @explore.
  ///
  /// In fr, this message translates to:
  /// **'Explorer'**
  String get explore;

  /// No description provided for @add.
  ///
  /// In fr, this message translates to:
  /// **'Ajouter'**
  String get add;

  /// No description provided for @yes.
  ///
  /// In fr, this message translates to:
  /// **'Oui'**
  String get yes;

  /// No description provided for @no.
  ///
  /// In fr, this message translates to:
  /// **'Non'**
  String get no;

  /// No description provided for @nav_home.
  ///
  /// In fr, this message translates to:
  /// **'Accueil'**
  String get nav_home;

  /// No description provided for @nav_search.
  ///
  /// In fr, this message translates to:
  /// **'Recherche'**
  String get nav_search;

  /// No description provided for @nav_favorites.
  ///
  /// In fr, this message translates to:
  /// **'Favoris'**
  String get nav_favorites;

  /// No description provided for @nav_profile.
  ///
  /// In fr, this message translates to:
  /// **'Profil'**
  String get nav_profile;

  /// No description provided for @login_title.
  ///
  /// In fr, this message translates to:
  /// **'Connexion'**
  String get login_title;

  /// No description provided for @login_email_label.
  ///
  /// In fr, this message translates to:
  /// **'Email'**
  String get login_email_label;

  /// No description provided for @login_email_hint.
  ///
  /// In fr, this message translates to:
  /// **'Entrez votre email'**
  String get login_email_hint;

  /// No description provided for @login_email_required.
  ///
  /// In fr, this message translates to:
  /// **'Email requis'**
  String get login_email_required;

  /// No description provided for @login_email_invalid.
  ///
  /// In fr, this message translates to:
  /// **'Email invalide'**
  String get login_email_invalid;

  /// No description provided for @login_password_label.
  ///
  /// In fr, this message translates to:
  /// **'Mot de passe'**
  String get login_password_label;

  /// No description provided for @login_password_hint.
  ///
  /// In fr, this message translates to:
  /// **'Entrez votre mot de passe'**
  String get login_password_hint;

  /// No description provided for @login_password_required.
  ///
  /// In fr, this message translates to:
  /// **'Mot de passe requis'**
  String get login_password_required;

  /// No description provided for @login_password_min.
  ///
  /// In fr, this message translates to:
  /// **'6 caractères minimum'**
  String get login_password_min;

  /// No description provided for @login_forgot_password.
  ///
  /// In fr, this message translates to:
  /// **'Mot de passe oublié ?'**
  String get login_forgot_password;

  /// No description provided for @login_button.
  ///
  /// In fr, this message translates to:
  /// **'Se connecter'**
  String get login_button;

  /// No description provided for @login_no_account.
  ///
  /// In fr, this message translates to:
  /// **'Pas encore de compte ?'**
  String get login_no_account;

  /// No description provided for @login_register_link.
  ///
  /// In fr, this message translates to:
  /// **'S\'inscrire'**
  String get login_register_link;

  /// No description provided for @login_error_invalid.
  ///
  /// In fr, this message translates to:
  /// **'Email ou mot de passe incorrect'**
  String get login_error_invalid;

  /// No description provided for @register_title.
  ///
  /// In fr, this message translates to:
  /// **'Inscription'**
  String get register_title;

  /// No description provided for @register_full_name_label.
  ///
  /// In fr, this message translates to:
  /// **'Nom complet'**
  String get register_full_name_label;

  /// No description provided for @register_full_name_required.
  ///
  /// In fr, this message translates to:
  /// **'Nom requis'**
  String get register_full_name_required;

  /// No description provided for @register_email_label.
  ///
  /// In fr, this message translates to:
  /// **'Email'**
  String get register_email_label;

  /// No description provided for @register_email_required.
  ///
  /// In fr, this message translates to:
  /// **'Email requis'**
  String get register_email_required;

  /// No description provided for @register_email_invalid.
  ///
  /// In fr, this message translates to:
  /// **'Email invalide'**
  String get register_email_invalid;

  /// No description provided for @register_phone_label.
  ///
  /// In fr, this message translates to:
  /// **'Téléphone'**
  String get register_phone_label;

  /// No description provided for @register_phone_required.
  ///
  /// In fr, this message translates to:
  /// **'Téléphone requis'**
  String get register_phone_required;

  /// No description provided for @register_phone_hint.
  ///
  /// In fr, this message translates to:
  /// **'06XXXXXXXX'**
  String get register_phone_hint;

  /// No description provided for @register_account_type_label.
  ///
  /// In fr, this message translates to:
  /// **'Type de compte'**
  String get register_account_type_label;

  /// No description provided for @register_account_type_tenant.
  ///
  /// In fr, this message translates to:
  /// **'Je cherche un bien'**
  String get register_account_type_tenant;

  /// No description provided for @register_account_type_owner.
  ///
  /// In fr, this message translates to:
  /// **'Je dépose une annonce'**
  String get register_account_type_owner;

  /// No description provided for @register_password_label.
  ///
  /// In fr, this message translates to:
  /// **'Mot de passe'**
  String get register_password_label;

  /// No description provided for @register_password_min.
  ///
  /// In fr, this message translates to:
  /// **'6 caractères minimum'**
  String get register_password_min;

  /// No description provided for @register_password_confirm_label.
  ///
  /// In fr, this message translates to:
  /// **'Confirmer le mot de passe'**
  String get register_password_confirm_label;

  /// No description provided for @register_password_confirm_required.
  ///
  /// In fr, this message translates to:
  /// **'Confirmation requise'**
  String get register_password_confirm_required;

  /// No description provided for @register_password_mismatch.
  ///
  /// In fr, this message translates to:
  /// **'Les mots de passe ne correspondent pas'**
  String get register_password_mismatch;

  /// No description provided for @register_button.
  ///
  /// In fr, this message translates to:
  /// **'S\'inscrire'**
  String get register_button;

  /// No description provided for @register_has_account.
  ///
  /// In fr, this message translates to:
  /// **'Déjà un compte ?'**
  String get register_has_account;

  /// No description provided for @register_login_link.
  ///
  /// In fr, this message translates to:
  /// **'Se connecter'**
  String get register_login_link;

  /// No description provided for @register_success.
  ///
  /// In fr, this message translates to:
  /// **'Inscription réussie ! Connectez-vous.'**
  String get register_success;

  /// No description provided for @register_error.
  ///
  /// In fr, this message translates to:
  /// **'Erreur lors de l\'inscription. Veuillez réessayer.'**
  String get register_error;

  /// No description provided for @home_app_bar_title.
  ///
  /// In fr, this message translates to:
  /// **'MAROC-LOC'**
  String get home_app_bar_title;

  /// No description provided for @home_hero_badge.
  ///
  /// In fr, this message translates to:
  /// **'L\'immobilier intelligent'**
  String get home_hero_badge;

  /// No description provided for @home_hero_title.
  ///
  /// In fr, this message translates to:
  /// **'Trouvez votre bien\nidéal au Maroc'**
  String get home_hero_title;

  /// No description provided for @home_search_hint.
  ///
  /// In fr, this message translates to:
  /// **'Rechercher un bien, une ville...'**
  String get home_search_hint;

  /// No description provided for @home_stats_properties.
  ///
  /// In fr, this message translates to:
  /// **'Biens'**
  String get home_stats_properties;

  /// No description provided for @home_stats_users.
  ///
  /// In fr, this message translates to:
  /// **'Utilisateurs'**
  String get home_stats_users;

  /// No description provided for @home_stats_cities.
  ///
  /// In fr, this message translates to:
  /// **'Villes'**
  String get home_stats_cities;

  /// No description provided for @home_category_title.
  ///
  /// In fr, this message translates to:
  /// **'Explorer par catégorie'**
  String get home_category_title;

  /// No description provided for @home_selection_title.
  ///
  /// In fr, this message translates to:
  /// **'Sélection du moment'**
  String get home_selection_title;

  /// No description provided for @home_sponsored_badge.
  ///
  /// In fr, this message translates to:
  /// **'Sponsorisé'**
  String get home_sponsored_badge;

  /// No description provided for @home_recommendations_title.
  ///
  /// In fr, this message translates to:
  /// **'Recommandations'**
  String get home_recommendations_title;

  /// No description provided for @home_feed_title.
  ///
  /// In fr, this message translates to:
  /// **'Biens disponibles'**
  String get home_feed_title;

  /// No description provided for @home_feed_results.
  ///
  /// In fr, this message translates to:
  /// **'résultats'**
  String get home_feed_results;

  /// No description provided for @home_feed_error.
  ///
  /// In fr, this message translates to:
  /// **'Erreur de chargement'**
  String get home_feed_error;

  /// No description provided for @home_feed_empty.
  ///
  /// In fr, this message translates to:
  /// **'Aucun bien disponible'**
  String get home_feed_empty;

  /// No description provided for @home_feed_empty_desc.
  ///
  /// In fr, this message translates to:
  /// **'Les annonces apparaîtront ici.'**
  String get home_feed_empty_desc;

  /// No description provided for @home_cities_title.
  ///
  /// In fr, this message translates to:
  /// **'Explorer par ville'**
  String get home_cities_title;

  /// No description provided for @property_type_rent.
  ///
  /// In fr, this message translates to:
  /// **'Location'**
  String get property_type_rent;

  /// No description provided for @property_type_buy.
  ///
  /// In fr, this message translates to:
  /// **'Achat'**
  String get property_type_buy;

  /// No description provided for @property_type_mortgage.
  ///
  /// In fr, this message translates to:
  /// **'Rahn'**
  String get property_type_mortgage;

  /// No description provided for @property_not_found.
  ///
  /// In fr, this message translates to:
  /// **'Propriété non trouvée'**
  String get property_not_found;

  /// No description provided for @property_verified.
  ///
  /// In fr, this message translates to:
  /// **'Vérifié'**
  String get property_verified;

  /// No description provided for @property_currency.
  ///
  /// In fr, this message translates to:
  /// **'MAD'**
  String get property_currency;

  /// No description provided for @property_per_month.
  ///
  /// In fr, this message translates to:
  /// **'/mois'**
  String get property_per_month;

  /// No description provided for @property_characteristics.
  ///
  /// In fr, this message translates to:
  /// **'Caractéristiques'**
  String get property_characteristics;

  /// No description provided for @property_feature_parking.
  ///
  /// In fr, this message translates to:
  /// **'Parking'**
  String get property_feature_parking;

  /// No description provided for @property_feature_pool.
  ///
  /// In fr, this message translates to:
  /// **'Piscine'**
  String get property_feature_pool;

  /// No description provided for @property_feature_furnished.
  ///
  /// In fr, this message translates to:
  /// **'Meublé'**
  String get property_feature_furnished;

  /// No description provided for @property_feature_ac.
  ///
  /// In fr, this message translates to:
  /// **'Clim'**
  String get property_feature_ac;

  /// No description provided for @property_feature_garden.
  ///
  /// In fr, this message translates to:
  /// **'Jardin'**
  String get property_feature_garden;

  /// No description provided for @property_feature_elevator.
  ///
  /// In fr, this message translates to:
  /// **'Ascenseur'**
  String get property_feature_elevator;

  /// No description provided for @property_description.
  ///
  /// In fr, this message translates to:
  /// **'Description'**
  String get property_description;

  /// No description provided for @property_message_cta.
  ///
  /// In fr, this message translates to:
  /// **'Message'**
  String get property_message_cta;

  /// No description provided for @property_call_cta.
  ///
  /// In fr, this message translates to:
  /// **'Appeler'**
  String get property_call_cta;

  /// No description provided for @property_detail_reserve.
  ///
  /// In fr, this message translates to:
  /// **'Réserver'**
  String get property_detail_reserve;

  /// No description provided for @property_detail_buy.
  ///
  /// In fr, this message translates to:
  /// **'Acheter'**
  String get property_detail_buy;

  /// No description provided for @property_detail_rahn.
  ///
  /// In fr, this message translates to:
  /// **'Infos Rahn'**
  String get property_detail_rahn;

  /// No description provided for @property_detail_rahn_info.
  ///
  /// In fr, this message translates to:
  /// **'Ce bien est proposé en Rahn (crédit-bail). Pour avancer, contactez directement le propriétaire pour discuter des conditions et des documents requis.'**
  String get property_detail_rahn_info;

  /// No description provided for @property_detail_view_owner_profile.
  ///
  /// In fr, this message translates to:
  /// **'Voir le profil du propriétaire'**
  String get property_detail_view_owner_profile;

  /// No description provided for @property_price_per_square_meter.
  ///
  /// In fr, this message translates to:
  /// **'Prix au m²'**
  String get property_price_per_square_meter;

  /// No description provided for @property_whatsapp_message.
  ///
  /// In fr, this message translates to:
  /// **'Bonjour, je suis intéressé par votre bien : {title}'**
  String property_whatsapp_message(Object title);

  /// No description provided for @payment_reservation_description.
  ///
  /// In fr, this message translates to:
  /// **'Caution de réservation'**
  String get payment_reservation_description;

  /// No description provided for @payment_purchase_description.
  ///
  /// In fr, this message translates to:
  /// **'Paiement d\'achat'**
  String get payment_purchase_description;

  /// No description provided for @property_retry.
  ///
  /// In fr, this message translates to:
  /// **'Réessayer'**
  String get property_retry;

  /// No description provided for @property_surface_unit.
  ///
  /// In fr, this message translates to:
  /// **' m²'**
  String get property_surface_unit;

  /// No description provided for @property_rooms_unit.
  ///
  /// In fr, this message translates to:
  /// **' pièces'**
  String get property_rooms_unit;

  /// No description provided for @property_bedrooms_unit.
  ///
  /// In fr, this message translates to:
  /// **' ch'**
  String get property_bedrooms_unit;

  /// No description provided for @property_bathrooms_unit.
  ///
  /// In fr, this message translates to:
  /// **' sdb'**
  String get property_bathrooms_unit;

  /// No description provided for @favorites_title.
  ///
  /// In fr, this message translates to:
  /// **'Mes favoris'**
  String get favorites_title;

  /// No description provided for @favorites_empty_title.
  ///
  /// In fr, this message translates to:
  /// **'Votre sélection est vide'**
  String get favorites_empty_title;

  /// No description provided for @favorites_empty_desc.
  ///
  /// In fr, this message translates to:
  /// **'Sauvegardez les biens qui vous plaisent.'**
  String get favorites_empty_desc;

  /// No description provided for @favorites_explore.
  ///
  /// In fr, this message translates to:
  /// **'Explorer'**
  String get favorites_explore;

  /// No description provided for @messages_title.
  ///
  /// In fr, this message translates to:
  /// **'Messages'**
  String get messages_title;

  /// No description provided for @messages_search_hint.
  ///
  /// In fr, this message translates to:
  /// **'Rechercher une conversation...'**
  String get messages_search_hint;

  /// No description provided for @messages_empty_title.
  ///
  /// In fr, this message translates to:
  /// **'Pas encore de messages'**
  String get messages_empty_title;

  /// No description provided for @messages_empty_desc.
  ///
  /// In fr, this message translates to:
  /// **'Contactez un propriétaire pour démarrer.'**
  String get messages_empty_desc;

  /// No description provided for @notifications_title.
  ///
  /// In fr, this message translates to:
  /// **'Notifications'**
  String get notifications_title;

  /// No description provided for @notifications_mark_all_read.
  ///
  /// In fr, this message translates to:
  /// **'Tout lire'**
  String get notifications_mark_all_read;

  /// No description provided for @notifications_empty.
  ///
  /// In fr, this message translates to:
  /// **'Aucune notification'**
  String get notifications_empty;

  /// No description provided for @onboarding_title_1.
  ///
  /// In fr, this message translates to:
  /// **'Bienvenue sur MAROC-LOC'**
  String get onboarding_title_1;

  /// No description provided for @onboarding_desc_1.
  ///
  /// In fr, this message translates to:
  /// **'La plateforme immobilière intelligente du Maroc.'**
  String get onboarding_desc_1;

  /// No description provided for @onboarding_title_2.
  ///
  /// In fr, this message translates to:
  /// **'Recherche intelligente'**
  String get onboarding_title_2;

  /// No description provided for @onboarding_desc_2.
  ///
  /// In fr, this message translates to:
  /// **'Utilisez notre IA pour chercher en langage naturel.'**
  String get onboarding_desc_2;

  /// No description provided for @onboarding_title_3.
  ///
  /// In fr, this message translates to:
  /// **'Sauvegardez vos coups de cœur'**
  String get onboarding_title_3;

  /// No description provided for @onboarding_desc_3.
  ///
  /// In fr, this message translates to:
  /// **'Créez votre sélection personnelle.'**
  String get onboarding_desc_3;

  /// No description provided for @onboarding_title_4.
  ///
  /// In fr, this message translates to:
  /// **'Assistant IA personnel'**
  String get onboarding_title_4;

  /// No description provided for @onboarding_desc_4.
  ///
  /// In fr, this message translates to:
  /// **'Notre assistant parle français, arabe et darija.'**
  String get onboarding_desc_4;

  /// No description provided for @onboarding_title_5.
  ///
  /// In fr, this message translates to:
  /// **'Passez à la vitesse supérieure'**
  String get onboarding_title_5;

  /// No description provided for @onboarding_desc_5.
  ///
  /// In fr, this message translates to:
  /// **'Débloquez les analytics IA et la visibilité premium.'**
  String get onboarding_desc_5;

  /// No description provided for @onboarding_skip.
  ///
  /// In fr, this message translates to:
  /// **'Passer'**
  String get onboarding_skip;

  /// No description provided for @onboarding_previous.
  ///
  /// In fr, this message translates to:
  /// **'Précédent'**
  String get onboarding_previous;

  /// No description provided for @onboarding_next.
  ///
  /// In fr, this message translates to:
  /// **'Suivant'**
  String get onboarding_next;

  /// No description provided for @onboarding_start.
  ///
  /// In fr, this message translates to:
  /// **'Commencer'**
  String get onboarding_start;

  /// No description provided for @onboarding_finish.
  ///
  /// In fr, this message translates to:
  /// **'Terminer'**
  String get onboarding_finish;

  /// No description provided for @splash_title.
  ///
  /// In fr, this message translates to:
  /// **'MAROC-LOC'**
  String get splash_title;

  /// No description provided for @splash_tagline.
  ///
  /// In fr, this message translates to:
  /// **'IA · IMMOBILIER · MAROC'**
  String get splash_tagline;

  /// No description provided for @splash_init.
  ///
  /// In fr, this message translates to:
  /// **'Initialisation...'**
  String get splash_init;

  /// No description provided for @splash_connecting.
  ///
  /// In fr, this message translates to:
  /// **'Connexion au serveur...'**
  String get splash_connecting;

  /// No description provided for @splash_loading_data.
  ///
  /// In fr, this message translates to:
  /// **'Chargement des données...'**
  String get splash_loading_data;

  /// No description provided for @splash_preparing.
  ///
  /// In fr, this message translates to:
  /// **'Préparation de l\'interface...'**
  String get splash_preparing;

  /// No description provided for @splash_starting.
  ///
  /// In fr, this message translates to:
  /// **'Démarrage...'**
  String get splash_starting;

  /// No description provided for @empty_property_title.
  ///
  /// In fr, this message translates to:
  /// **'Aucune propriété'**
  String get empty_property_title;

  /// No description provided for @empty_property_desc.
  ///
  /// In fr, this message translates to:
  /// **'Commencez par ajouter votre première propriété.'**
  String get empty_property_desc;

  /// No description provided for @empty_search_title.
  ///
  /// In fr, this message translates to:
  /// **'Aucun résultat'**
  String get empty_search_title;

  /// No description provided for @empty_search_desc.
  ///
  /// In fr, this message translates to:
  /// **'Essayez d\'autres critères de recherche.'**
  String get empty_search_desc;

  /// No description provided for @empty_generic_title.
  ///
  /// In fr, this message translates to:
  /// **'Rien à afficher'**
  String get empty_generic_title;

  /// No description provided for @empty_generic_desc.
  ///
  /// In fr, this message translates to:
  /// **'Revenez plus tard.'**
  String get empty_generic_desc;

  /// No description provided for @error_loading.
  ///
  /// In fr, this message translates to:
  /// **'Erreur de chargement'**
  String get error_loading;

  /// No description provided for @error_search.
  ///
  /// In fr, this message translates to:
  /// **'Erreur de recherche'**
  String get error_search;

  /// No description provided for @error_not_found.
  ///
  /// In fr, this message translates to:
  /// **'Propriété introuvable'**
  String get error_not_found;

  /// No description provided for @analytics_title.
  ///
  /// In fr, this message translates to:
  /// **'Analytics IA'**
  String get analytics_title;

  /// No description provided for @analytics_intents.
  ///
  /// In fr, this message translates to:
  /// **'Distribution des Intents'**
  String get analytics_intents;

  /// No description provided for @analytics_languages.
  ///
  /// In fr, this message translates to:
  /// **'Langues utilisées'**
  String get analytics_languages;

  /// No description provided for @analytics_timeline.
  ///
  /// In fr, this message translates to:
  /// **'Activité ({days} jours)'**
  String analytics_timeline(Object days);

  /// No description provided for @analytics_conversations.
  ///
  /// In fr, this message translates to:
  /// **'Conversations'**
  String get analytics_conversations;

  /// No description provided for @analytics_messages.
  ///
  /// In fr, this message translates to:
  /// **'Messages'**
  String get analytics_messages;

  /// No description provided for @analytics_avg_time.
  ///
  /// In fr, this message translates to:
  /// **'Temps moyen'**
  String get analytics_avg_time;

  /// No description provided for @analytics_recommendations.
  ///
  /// In fr, this message translates to:
  /// **'Recommandations'**
  String get analytics_recommendations;

  /// No description provided for @analytics_no_intent_data.
  ///
  /// In fr, this message translates to:
  /// **'Aucune donnée d\'intent disponible'**
  String get analytics_no_intent_data;

  /// No description provided for @analytics_no_language_data.
  ///
  /// In fr, this message translates to:
  /// **'Aucune donnée de langue disponible'**
  String get analytics_no_language_data;

  /// No description provided for @analytics_no_timeline_data.
  ///
  /// In fr, this message translates to:
  /// **'Aucune donnée historique disponible'**
  String get analytics_no_timeline_data;

  /// No description provided for @chat_typing.
  ///
  /// In fr, this message translates to:
  /// **'En train d\'écrire...'**
  String get chat_typing;

  /// No description provided for @chat_online.
  ///
  /// In fr, this message translates to:
  /// **'En ligne'**
  String get chat_online;

  /// No description provided for @chat_offline.
  ///
  /// In fr, this message translates to:
  /// **'Hors ligne'**
  String get chat_offline;

  /// No description provided for @chat_placeholder.
  ///
  /// In fr, this message translates to:
  /// **'Écrire un message...'**
  String get chat_placeholder;

  /// No description provided for @chat_reset_title.
  ///
  /// In fr, this message translates to:
  /// **'Nouvelle conversation'**
  String get chat_reset_title;

  /// No description provided for @chat_reset_confirm.
  ///
  /// In fr, this message translates to:
  /// **'Voulez-vous effacer toute la conversation ?'**
  String get chat_reset_confirm;

  /// No description provided for @chat_speak.
  ///
  /// In fr, this message translates to:
  /// **'Écouter'**
  String get chat_speak;

  /// No description provided for @today.
  ///
  /// In fr, this message translates to:
  /// **'Aujourd\'hui'**
  String get today;

  /// No description provided for @yesterday.
  ///
  /// In fr, this message translates to:
  /// **'Hier'**
  String get yesterday;

  /// No description provided for @chatbot_typing.
  ///
  /// In fr, this message translates to:
  /// **'L\'IA réfléchit...'**
  String get chatbot_typing;

  /// No description provided for @property_video_visit.
  ///
  /// In fr, this message translates to:
  /// **'Visite vidéo'**
  String get property_video_visit;

  /// No description provided for @property_start_video.
  ///
  /// In fr, this message translates to:
  /// **'Lancer la visite vidéo'**
  String get property_start_video;

  /// No description provided for @property_whatsapp.
  ///
  /// In fr, this message translates to:
  /// **'WhatsApp'**
  String get property_whatsapp;

  /// No description provided for @property_similar.
  ///
  /// In fr, this message translates to:
  /// **'Biens similaires'**
  String get property_similar;

  /// No description provided for @dashboard_title.
  ///
  /// In fr, this message translates to:
  /// **'Tableau de bord'**
  String get dashboard_title;

  /// No description provided for @dashboard_no_properties.
  ///
  /// In fr, this message translates to:
  /// **'Aucune propriété'**
  String get dashboard_no_properties;

  /// No description provided for @dashboard_add_property.
  ///
  /// In fr, this message translates to:
  /// **'Ajouter une propriété'**
  String get dashboard_add_property;

  /// No description provided for @dashboard_confirm_delete.
  ///
  /// In fr, this message translates to:
  /// **'Confirmer la suppression'**
  String get dashboard_confirm_delete;

  /// No description provided for @visits_title.
  ///
  /// In fr, this message translates to:
  /// **'Visites'**
  String get visits_title;

  /// No description provided for @visits_empty.
  ///
  /// In fr, this message translates to:
  /// **'Aucune visite planifiée'**
  String get visits_empty;

  /// No description provided for @visits_schedule.
  ///
  /// In fr, this message translates to:
  /// **'Planifier une visite'**
  String get visits_schedule;

  /// No description provided for @visits_status_pending.
  ///
  /// In fr, this message translates to:
  /// **'En attente'**
  String get visits_status_pending;

  /// No description provided for @visits_status_confirmed.
  ///
  /// In fr, this message translates to:
  /// **'Confirmée'**
  String get visits_status_confirmed;

  /// No description provided for @visits_status_completed.
  ///
  /// In fr, this message translates to:
  /// **'Terminée'**
  String get visits_status_completed;

  /// No description provided for @visits_status_cancelled.
  ///
  /// In fr, this message translates to:
  /// **'Annulée'**
  String get visits_status_cancelled;

  /// No description provided for @visits_cancel.
  ///
  /// In fr, this message translates to:
  /// **'Annuler'**
  String get visits_cancel;

  /// No description provided for @visits_reschedule.
  ///
  /// In fr, this message translates to:
  /// **'Reprogrammer'**
  String get visits_reschedule;

  /// No description provided for @admin_title.
  ///
  /// In fr, this message translates to:
  /// **'Administration'**
  String get admin_title;

  /// No description provided for @admin_users.
  ///
  /// In fr, this message translates to:
  /// **'Utilisateurs'**
  String get admin_users;

  /// No description provided for @admin_properties.
  ///
  /// In fr, this message translates to:
  /// **'Propriétés'**
  String get admin_properties;

  /// No description provided for @admin_pending_approval.
  ///
  /// In fr, this message translates to:
  /// **'En attente d\'approbation'**
  String get admin_pending_approval;

  /// No description provided for @admin_stats.
  ///
  /// In fr, this message translates to:
  /// **'Statistiques'**
  String get admin_stats;

  /// No description provided for @admin_platform_overview.
  ///
  /// In fr, this message translates to:
  /// **'Vue d\'ensemble de la plateforme'**
  String get admin_platform_overview;

  /// No description provided for @chatbot_hello.
  ///
  /// In fr, this message translates to:
  /// **'Bonjour ! Je suis votre assistant immobilier. Comment puis-je vous aider ?'**
  String get chatbot_hello;

  /// No description provided for @chatbot_property_search.
  ///
  /// In fr, this message translates to:
  /// **'Rechercher un bien'**
  String get chatbot_property_search;

  /// No description provided for @chatbot_price_check.
  ///
  /// In fr, this message translates to:
  /// **'Vérifier les prix'**
  String get chatbot_price_check;

  /// No description provided for @chatbot_view_detail.
  ///
  /// In fr, this message translates to:
  /// **'Voir détail'**
  String get chatbot_view_detail;

  /// No description provided for @admin_monthly_trends.
  ///
  /// In fr, this message translates to:
  /// **'Tendances mensuelles'**
  String get admin_monthly_trends;

  /// No description provided for @admin_yearly_trends.
  ///
  /// In fr, this message translates to:
  /// **'Tendances annuelles'**
  String get admin_yearly_trends;

  /// No description provided for @admin_no_monthly_data.
  ///
  /// In fr, this message translates to:
  /// **'Aucune donnée mensuelle'**
  String get admin_no_monthly_data;

  /// No description provided for @admin_no_yearly_data.
  ///
  /// In fr, this message translates to:
  /// **'Aucune donnée annuelle'**
  String get admin_no_yearly_data;

  /// No description provided for @admin_users_short.
  ///
  /// In fr, this message translates to:
  /// **'Utilisateurs'**
  String get admin_users_short;

  /// No description provided for @admin_properties_short.
  ///
  /// In fr, this message translates to:
  /// **'Propriétés'**
  String get admin_properties_short;

  /// No description provided for @admin_reviews_short.
  ///
  /// In fr, this message translates to:
  /// **'Avis'**
  String get admin_reviews_short;

  /// No description provided for @admin_revenue_short.
  ///
  /// In fr, this message translates to:
  /// **'Revenu'**
  String get admin_revenue_short;

  /// No description provided for @admin_tab_dashboard.
  ///
  /// In fr, this message translates to:
  /// **'Tableau de bord'**
  String get admin_tab_dashboard;

  /// No description provided for @admin_tab_users.
  ///
  /// In fr, this message translates to:
  /// **'Utilisateurs'**
  String get admin_tab_users;

  /// No description provided for @admin_tab_properties.
  ///
  /// In fr, this message translates to:
  /// **'Propriétés'**
  String get admin_tab_properties;

  /// No description provided for @admin_tab_reviews.
  ///
  /// In fr, this message translates to:
  /// **'Avis'**
  String get admin_tab_reviews;

  /// No description provided for @admin_tab_settings.
  ///
  /// In fr, this message translates to:
  /// **'Paramètres'**
  String get admin_tab_settings;

  /// No description provided for @approve.
  ///
  /// In fr, this message translates to:
  /// **'Approuver'**
  String get approve;

  /// No description provided for @reject.
  ///
  /// In fr, this message translates to:
  /// **'Rejeter'**
  String get reject;

  /// No description provided for @verify.
  ///
  /// In fr, this message translates to:
  /// **'Vérifier'**
  String get verify;

  /// No description provided for @unverify.
  ///
  /// In fr, this message translates to:
  /// **'Annuler la vérification'**
  String get unverify;

  /// No description provided for @admin_total_messages.
  ///
  /// In fr, this message translates to:
  /// **'Messages totaux'**
  String get admin_total_messages;

  /// No description provided for @feature_ai_chat.
  ///
  /// In fr, this message translates to:
  /// **'Chat IA'**
  String get feature_ai_chat;

  /// No description provided for @feature_voice_search.
  ///
  /// In fr, this message translates to:
  /// **'Recherche vocale'**
  String get feature_voice_search;

  /// No description provided for @feature_ads.
  ///
  /// In fr, this message translates to:
  /// **'Publicités'**
  String get feature_ads;

  /// No description provided for @feature_reviews.
  ///
  /// In fr, this message translates to:
  /// **'Avis'**
  String get feature_reviews;

  /// No description provided for @feature_payments.
  ///
  /// In fr, this message translates to:
  /// **'Paiements'**
  String get feature_payments;

  /// No description provided for @language.
  ///
  /// In fr, this message translates to:
  /// **'Langue'**
  String get language;

  /// No description provided for @language_french.
  ///
  /// In fr, this message translates to:
  /// **'Français'**
  String get language_french;

  /// No description provided for @language_english.
  ///
  /// In fr, this message translates to:
  /// **'Anglais'**
  String get language_english;

  /// No description provided for @language_arabic.
  ///
  /// In fr, this message translates to:
  /// **'Arabe'**
  String get language_arabic;

  /// No description provided for @nav_messages.
  ///
  /// In fr, this message translates to:
  /// **'Messages'**
  String get nav_messages;

  /// No description provided for @favorite_login_required_title.
  ///
  /// In fr, this message translates to:
  /// **'Connexion requise'**
  String get favorite_login_required_title;

  /// No description provided for @favorite_login_required_message.
  ///
  /// In fr, this message translates to:
  /// **'Vous devez être connecté pour ajouter des favoris.'**
  String get favorite_login_required_message;

  /// No description provided for @dashboard_my_properties.
  ///
  /// In fr, this message translates to:
  /// **'Mes propriétés'**
  String get dashboard_my_properties;

  /// No description provided for @dashboard_property_count.
  ///
  /// In fr, this message translates to:
  /// **'{count} biens'**
  String dashboard_property_count(Object count);

  /// No description provided for @tooltip_new_property.
  ///
  /// In fr, this message translates to:
  /// **'Nouvelle propriété'**
  String get tooltip_new_property;

  /// No description provided for @stats_views.
  ///
  /// In fr, this message translates to:
  /// **'Vues'**
  String get stats_views;

  /// No description provided for @stats_favorites.
  ///
  /// In fr, this message translates to:
  /// **'Favoris'**
  String get stats_favorites;

  /// No description provided for @stats_inquiries.
  ///
  /// In fr, this message translates to:
  /// **'Demandes'**
  String get stats_inquiries;

  /// No description provided for @quick_action_new_ad.
  ///
  /// In fr, this message translates to:
  /// **'Nouvelle annonce'**
  String get quick_action_new_ad;

  /// No description provided for @quick_action_visits.
  ///
  /// In fr, this message translates to:
  /// **'Visites'**
  String get quick_action_visits;

  /// No description provided for @quick_action_analytics.
  ///
  /// In fr, this message translates to:
  /// **'Analytics'**
  String get quick_action_analytics;

  /// No description provided for @quick_action_boost.
  ///
  /// In fr, this message translates to:
  /// **'Booster'**
  String get quick_action_boost;

  /// No description provided for @delete_confirmation_message.
  ///
  /// In fr, this message translates to:
  /// **'Supprimer \"{title}\" ?'**
  String delete_confirmation_message(Object title);

  /// No description provided for @tooltip_boost.
  ///
  /// In fr, this message translates to:
  /// **'Booster'**
  String get tooltip_boost;

  /// No description provided for @status_available.
  ///
  /// In fr, this message translates to:
  /// **'Disponible'**
  String get status_available;

  /// No description provided for @status_pending.
  ///
  /// In fr, this message translates to:
  /// **'En attente'**
  String get status_pending;

  /// No description provided for @status_reserved.
  ///
  /// In fr, this message translates to:
  /// **'Réservé'**
  String get status_reserved;

  /// No description provided for @status_rented.
  ///
  /// In fr, this message translates to:
  /// **'Loué'**
  String get status_rented;

  /// No description provided for @unit_currency.
  ///
  /// In fr, this message translates to:
  /// **'MAD'**
  String get unit_currency;

  /// No description provided for @unit_area.
  ///
  /// In fr, this message translates to:
  /// **'m²'**
  String get unit_area;

  /// No description provided for @chatbot_title.
  ///
  /// In fr, this message translates to:
  /// **'MAROC-LOC AI'**
  String get chatbot_title;

  /// No description provided for @chatbot_new_conversation.
  ///
  /// In fr, this message translates to:
  /// **'Nouvelle conversation'**
  String get chatbot_new_conversation;

  /// No description provided for @chatbot_language.
  ///
  /// In fr, this message translates to:
  /// **'Langue'**
  String get chatbot_language;

  /// No description provided for @chatbot_mic_start.
  ///
  /// In fr, this message translates to:
  /// **'Microphone'**
  String get chatbot_mic_start;

  /// No description provided for @chatbot_mic_stop.
  ///
  /// In fr, this message translates to:
  /// **'Arrêter'**
  String get chatbot_mic_stop;

  /// No description provided for @chatbot_send.
  ///
  /// In fr, this message translates to:
  /// **'Envoyer'**
  String get chatbot_send;

  /// No description provided for @chatbot_error_initial.
  ///
  /// In fr, this message translates to:
  /// **'Impossible de démarrer la conversation.'**
  String get chatbot_error_initial;

  /// No description provided for @chat_send.
  ///
  /// In fr, this message translates to:
  /// **'Envoyer'**
  String get chat_send;

  /// No description provided for @roleAdmin.
  ///
  /// In fr, this message translates to:
  /// **'Admin'**
  String get roleAdmin;

  /// No description provided for @roleOwner.
  ///
  /// In fr, this message translates to:
  /// **'Propriétaire'**
  String get roleOwner;

  /// No description provided for @roleTenant.
  ///
  /// In fr, this message translates to:
  /// **'Locataire'**
  String get roleTenant;

  /// No description provided for @loadMore.
  ///
  /// In fr, this message translates to:
  /// **'Faites défiler pour voir plus'**
  String get loadMore;

  /// No description provided for @messageDeleted.
  ///
  /// In fr, this message translates to:
  /// **'Message supprimé'**
  String get messageDeleted;

  /// No description provided for @sendError.
  ///
  /// In fr, this message translates to:
  /// **'Erreur lors de l\'envoi'**
  String get sendError;

  /// No description provided for @search_title.
  ///
  /// In fr, this message translates to:
  /// **'Recherche'**
  String get search_title;

  /// No description provided for @tooltip_filters.
  ///
  /// In fr, this message translates to:
  /// **'Filtres'**
  String get tooltip_filters;

  /// No description provided for @filter_advanced_title.
  ///
  /// In fr, this message translates to:
  /// **'Filtres avancés'**
  String get filter_advanced_title;

  /// No description provided for @filter_min_price.
  ///
  /// In fr, this message translates to:
  /// **'Prix min ({currency})'**
  String filter_min_price(Object currency);

  /// No description provided for @filter_max_price.
  ///
  /// In fr, this message translates to:
  /// **'Prix max ({currency})'**
  String filter_max_price(Object currency);

  /// No description provided for @filter_city.
  ///
  /// In fr, this message translates to:
  /// **'Ville'**
  String get filter_city;

  /// No description provided for @filter_all_cities.
  ///
  /// In fr, this message translates to:
  /// **'Toutes les villes'**
  String get filter_all_cities;

  /// No description provided for @filter_property_type.
  ///
  /// In fr, this message translates to:
  /// **'Type de bien'**
  String get filter_property_type;

  /// No description provided for @filter_all_types.
  ///
  /// In fr, this message translates to:
  /// **'Tous les types'**
  String get filter_all_types;

  /// No description provided for @filter_transaction.
  ///
  /// In fr, this message translates to:
  /// **'Transaction'**
  String get filter_transaction;

  /// No description provided for @filter_all_transactions.
  ///
  /// In fr, this message translates to:
  /// **'Toutes'**
  String get filter_all_transactions;

  /// No description provided for @filter_rooms.
  ///
  /// In fr, this message translates to:
  /// **'Pièces'**
  String get filter_rooms;

  /// No description provided for @filter_all_rooms.
  ///
  /// In fr, this message translates to:
  /// **'Toutes'**
  String get filter_all_rooms;

  /// No description provided for @filter_min_surface.
  ///
  /// In fr, this message translates to:
  /// **'Surface min ({unit})'**
  String filter_min_surface(Object unit);

  /// No description provided for @filter_equipment.
  ///
  /// In fr, this message translates to:
  /// **'Équipements'**
  String get filter_equipment;

  /// No description provided for @filter_environment.
  ///
  /// In fr, this message translates to:
  /// **'Environnement'**
  String get filter_environment;

  /// No description provided for @filter_furnished.
  ///
  /// In fr, this message translates to:
  /// **'Meublé'**
  String get filter_furnished;

  /// No description provided for @filter_parking.
  ///
  /// In fr, this message translates to:
  /// **'Parking'**
  String get filter_parking;

  /// No description provided for @filter_pool.
  ///
  /// In fr, this message translates to:
  /// **'Piscine'**
  String get filter_pool;

  /// No description provided for @filter_garden.
  ///
  /// In fr, this message translates to:
  /// **'Jardin'**
  String get filter_garden;

  /// No description provided for @filter_ac.
  ///
  /// In fr, this message translates to:
  /// **'Clim'**
  String get filter_ac;

  /// No description provided for @filter_internet.
  ///
  /// In fr, this message translates to:
  /// **'Internet'**
  String get filter_internet;

  /// No description provided for @filter_security.
  ///
  /// In fr, this message translates to:
  /// **'Sécurité'**
  String get filter_security;

  /// No description provided for @filter_balcony.
  ///
  /// In fr, this message translates to:
  /// **'Balcon'**
  String get filter_balcony;

  /// No description provided for @filter_elevator.
  ///
  /// In fr, this message translates to:
  /// **'Ascenseur'**
  String get filter_elevator;

  /// No description provided for @filter_school.
  ///
  /// In fr, this message translates to:
  /// **'École'**
  String get filter_school;

  /// No description provided for @filter_hospital.
  ///
  /// In fr, this message translates to:
  /// **'Hôpital'**
  String get filter_hospital;

  /// No description provided for @filter_mosque.
  ///
  /// In fr, this message translates to:
  /// **'Mosquée'**
  String get filter_mosque;

  /// No description provided for @filter_bus.
  ///
  /// In fr, this message translates to:
  /// **'Bus'**
  String get filter_bus;

  /// No description provided for @filter_tram.
  ///
  /// In fr, this message translates to:
  /// **'Tram'**
  String get filter_tram;

  /// No description provided for @filter_reset.
  ///
  /// In fr, this message translates to:
  /// **'Réinitialiser'**
  String get filter_reset;

  /// No description provided for @filter_apply.
  ///
  /// In fr, this message translates to:
  /// **'Appliquer'**
  String get filter_apply;

  /// No description provided for @search_hint.
  ///
  /// In fr, this message translates to:
  /// **'Rechercher par ville...'**
  String get search_hint;

  /// No description provided for @search_no_results.
  ///
  /// In fr, this message translates to:
  /// **'Aucun bien ne correspond à votre recherche'**
  String get search_no_results;

  /// No description provided for @search_reset_filters.
  ///
  /// In fr, this message translates to:
  /// **'Réinitialiser les filtres'**
  String get search_reset_filters;

  /// No description provided for @payment_cmi_title.
  ///
  /// In fr, this message translates to:
  /// **'Paiement CMI'**
  String get payment_cmi_title;

  /// No description provided for @payment_cmi_connecting.
  ///
  /// In fr, this message translates to:
  /// **'Connexion à CMI...'**
  String get payment_cmi_connecting;

  /// No description provided for @payment_error_invalid_response.
  ///
  /// In fr, this message translates to:
  /// **'Réponse de paiement invalide : hash manquant.'**
  String get payment_error_invalid_response;

  /// No description provided for @payment_error_initiation.
  ///
  /// In fr, this message translates to:
  /// **'Erreur lors de l\'initiation du paiement'**
  String get payment_error_initiation;

  /// No description provided for @payment_verifying.
  ///
  /// In fr, this message translates to:
  /// **'Vérification du paiement...'**
  String get payment_verifying;

  /// No description provided for @payment_success.
  ///
  /// In fr, this message translates to:
  /// **'Paiement réussi'**
  String get payment_success;

  /// No description provided for @payment_failed.
  ///
  /// In fr, this message translates to:
  /// **'Paiement échoué'**
  String get payment_failed;

  /// No description provided for @payment_order_label.
  ///
  /// In fr, this message translates to:
  /// **'Commande : {orderId}'**
  String payment_order_label(Object orderId);

  /// No description provided for @payment_back_home.
  ///
  /// In fr, this message translates to:
  /// **'Retour à l\'accueil'**
  String get payment_back_home;

  /// No description provided for @boost_title.
  ///
  /// In fr, this message translates to:
  /// **'Booster votre bien'**
  String get boost_title;

  /// No description provided for @boost_type_featured.
  ///
  /// In fr, this message translates to:
  /// **'Mettre en vedette'**
  String get boost_type_featured;

  /// No description provided for @boost_type_top.
  ///
  /// In fr, this message translates to:
  /// **'Remonter en top'**
  String get boost_type_top;

  /// No description provided for @boost_type_banner.
  ///
  /// In fr, this message translates to:
  /// **'Bannière premium'**
  String get boost_type_banner;

  /// No description provided for @boost_per_week.
  ///
  /// In fr, this message translates to:
  /// **'{price} {currency}/semaine'**
  String boost_per_week(Object currency, Object price);

  /// No description provided for @boost_duration.
  ///
  /// In fr, this message translates to:
  /// **'Durée'**
  String get boost_duration;

  /// No description provided for @boost_total.
  ///
  /// In fr, this message translates to:
  /// **'Total à payer'**
  String get boost_total;

  /// No description provided for @boost_pay_and_boost.
  ///
  /// In fr, this message translates to:
  /// **'Payer et booster'**
  String get boost_pay_and_boost;

  /// No description provided for @duration_days.
  ///
  /// In fr, this message translates to:
  /// **'{days} jours'**
  String duration_days(Object days);

  /// No description provided for @empty_notifications_title.
  ///
  /// In fr, this message translates to:
  /// **'Pas de notifications'**
  String get empty_notifications_title;

  /// No description provided for @empty_notifications_desc.
  ///
  /// In fr, this message translates to:
  /// **'Vous serez notifié des nouveautés.'**
  String get empty_notifications_desc;

  /// No description provided for @property_image_of.
  ///
  /// In fr, this message translates to:
  /// **'Image de {title}'**
  String property_image_of(Object title);

  /// No description provided for @forgot_password_title.
  ///
  /// In fr, this message translates to:
  /// **'Mot de passe oublié ?'**
  String get forgot_password_title;

  /// No description provided for @forgot_password_desc.
  ///
  /// In fr, this message translates to:
  /// **'Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.'**
  String get forgot_password_desc;

  /// No description provided for @forgot_password_email_label.
  ///
  /// In fr, this message translates to:
  /// **'Email'**
  String get forgot_password_email_label;

  /// No description provided for @forgot_password_email_hint.
  ///
  /// In fr, this message translates to:
  /// **'votre@email.com'**
  String get forgot_password_email_hint;

  /// No description provided for @forgot_password_email_required.
  ///
  /// In fr, this message translates to:
  /// **'Veuillez entrer votre email'**
  String get forgot_password_email_required;

  /// No description provided for @forgot_password_email_invalid.
  ///
  /// In fr, this message translates to:
  /// **'Email invalide'**
  String get forgot_password_email_invalid;

  /// No description provided for @forgot_password_send.
  ///
  /// In fr, this message translates to:
  /// **'Envoyer le lien de réinitialisation'**
  String get forgot_password_send;

  /// No description provided for @forgot_password_back_to_login.
  ///
  /// In fr, this message translates to:
  /// **'Retour à la connexion'**
  String get forgot_password_back_to_login;

  /// No description provided for @forgot_password_email_sent.
  ///
  /// In fr, this message translates to:
  /// **'Email envoyé'**
  String get forgot_password_email_sent;

  /// No description provided for @mortgage_title.
  ///
  /// In fr, this message translates to:
  /// **'Calculateur de crédit'**
  String get mortgage_title;

  /// No description provided for @mortgage_price.
  ///
  /// In fr, this message translates to:
  /// **'Prix du bien'**
  String get mortgage_price;

  /// No description provided for @mortgage_down_payment.
  ///
  /// In fr, this message translates to:
  /// **'Apport initial'**
  String get mortgage_down_payment;

  /// No description provided for @mortgage_rate.
  ///
  /// In fr, this message translates to:
  /// **'Taux d\'intérêt annuel (%)'**
  String get mortgage_rate;

  /// No description provided for @mortgage_term.
  ///
  /// In fr, this message translates to:
  /// **'Durée du prêt (années)'**
  String get mortgage_term;

  /// No description provided for @mortgage_calculate.
  ///
  /// In fr, this message translates to:
  /// **'Calculer'**
  String get mortgage_calculate;

  /// No description provided for @mortgage_results.
  ///
  /// In fr, this message translates to:
  /// **'Résultats'**
  String get mortgage_results;

  /// No description provided for @mortgage_loan_amount.
  ///
  /// In fr, this message translates to:
  /// **'Montant du prêt'**
  String get mortgage_loan_amount;

  /// No description provided for @mortgage_monthly_payment.
  ///
  /// In fr, this message translates to:
  /// **'Mensualité'**
  String get mortgage_monthly_payment;

  /// No description provided for @mortgage_total_interest.
  ///
  /// In fr, this message translates to:
  /// **'Intérêts totaux'**
  String get mortgage_total_interest;

  /// No description provided for @mortgage_total_cost.
  ///
  /// In fr, this message translates to:
  /// **'Coût total'**
  String get mortgage_total_cost;

  /// No description provided for @boost_type_label.
  ///
  /// In fr, this message translates to:
  /// **'Type de boost'**
  String get boost_type_label;

  /// No description provided for @analytics_properties.
  ///
  /// In fr, this message translates to:
  /// **'Propriétés'**
  String get analytics_properties;

  /// No description provided for @analytics_views.
  ///
  /// In fr, this message translates to:
  /// **'Vues'**
  String get analytics_views;

  /// No description provided for @analytics_favorites.
  ///
  /// In fr, this message translates to:
  /// **'Favoris'**
  String get analytics_favorites;

  /// No description provided for @analytics_inquiries.
  ///
  /// In fr, this message translates to:
  /// **'Demandes'**
  String get analytics_inquiries;

  /// No description provided for @analytics_rating.
  ///
  /// In fr, this message translates to:
  /// **'Note'**
  String get analytics_rating;

  /// No description provided for @analytics_reviews.
  ///
  /// In fr, this message translates to:
  /// **'avis'**
  String get analytics_reviews;

  /// No description provided for @analytics_ad_spend.
  ///
  /// In fr, this message translates to:
  /// **'Budget pub'**
  String get analytics_ad_spend;

  /// No description provided for @analytics_property_status.
  ///
  /// In fr, this message translates to:
  /// **'Statut des propriétés'**
  String get analytics_property_status;

  /// No description provided for @analytics_active.
  ///
  /// In fr, this message translates to:
  /// **'Actif'**
  String get analytics_active;

  /// No description provided for @analytics_inactive.
  ///
  /// In fr, this message translates to:
  /// **'Inactif'**
  String get analytics_inactive;

  /// No description provided for @analytics_top_properties.
  ///
  /// In fr, this message translates to:
  /// **'Top propriétés'**
  String get analytics_top_properties;

  /// No description provided for @analytics_no_properties_yet.
  ///
  /// In fr, this message translates to:
  /// **'Aucune propriété pour le moment'**
  String get analytics_no_properties_yet;

  /// No description provided for @analytics_unknown.
  ///
  /// In fr, this message translates to:
  /// **'Inconnu'**
  String get analytics_unknown;

  /// No description provided for @profile_title.
  ///
  /// In fr, this message translates to:
  /// **'Profil'**
  String get profile_title;

  /// No description provided for @profile_edit.
  ///
  /// In fr, this message translates to:
  /// **'Modifier le profil'**
  String get profile_edit;

  /// No description provided for @profile_dashboard.
  ///
  /// In fr, this message translates to:
  /// **'Tableau de bord'**
  String get profile_dashboard;

  /// No description provided for @profile_admin.
  ///
  /// In fr, this message translates to:
  /// **'Administration'**
  String get profile_admin;

  /// No description provided for @profile_dark_mode.
  ///
  /// In fr, this message translates to:
  /// **'Mode sombre'**
  String get profile_dark_mode;

  /// No description provided for @profile_tools.
  ///
  /// In fr, this message translates to:
  /// **'Outils'**
  String get profile_tools;

  /// No description provided for @profile_mortgage_calculator.
  ///
  /// In fr, this message translates to:
  /// **'Calculateur de crédit'**
  String get profile_mortgage_calculator;

  /// No description provided for @profile_logout.
  ///
  /// In fr, this message translates to:
  /// **'Déconnexion'**
  String get profile_logout;

  /// No description provided for @payment_cmi_secure_title.
  ///
  /// In fr, this message translates to:
  /// **'Paiement sécurisé CMI'**
  String get payment_cmi_secure_title;

  /// No description provided for @payment_cancel.
  ///
  /// In fr, this message translates to:
  /// **'Annuler le paiement'**
  String get payment_cancel;

  /// No description provided for @tooltip_favorite.
  ///
  /// In fr, this message translates to:
  /// **'Ajouter aux favoris'**
  String get tooltip_favorite;

  /// No description provided for @tooltip_unfavorite.
  ///
  /// In fr, this message translates to:
  /// **'Retirer des favoris'**
  String get tooltip_unfavorite;

  /// No description provided for @tooltip_share.
  ///
  /// In fr, this message translates to:
  /// **'Partager'**
  String get tooltip_share;

  /// No description provided for @tooltip_refresh.
  ///
  /// In fr, this message translates to:
  /// **'Actualiser'**
  String get tooltip_refresh;

  /// No description provided for @tooltip_close.
  ///
  /// In fr, this message translates to:
  /// **'Fermer'**
  String get tooltip_close;

  /// No description provided for @tooltip_clear.
  ///
  /// In fr, this message translates to:
  /// **'Effacer'**
  String get tooltip_clear;

  /// No description provided for @tooltip_chatbot.
  ///
  /// In fr, this message translates to:
  /// **'Assistant IA'**
  String get tooltip_chatbot;

  /// No description provided for @common_required_field.
  ///
  /// In fr, this message translates to:
  /// **'Champ requis'**
  String get common_required_field;

  /// No description provided for @common_select.
  ///
  /// In fr, this message translates to:
  /// **'Sélectionnez'**
  String get common_select;

  /// No description provided for @common_date_format_hint.
  ///
  /// In fr, this message translates to:
  /// **'JJ/MM/AAAA'**
  String get common_date_format_hint;

  /// No description provided for @common_error_with_message.
  ///
  /// In fr, this message translates to:
  /// **'Erreur: {error}'**
  String common_error_with_message(Object error);

  /// No description provided for @language_french_flag.
  ///
  /// In fr, this message translates to:
  /// **'🇫🇷 Français'**
  String get language_french_flag;

  /// No description provided for @language_english_flag.
  ///
  /// In fr, this message translates to:
  /// **'🇬🇧 English'**
  String get language_english_flag;

  /// No description provided for @language_arabic_flag.
  ///
  /// In fr, this message translates to:
  /// **'🇸🇦 العربية'**
  String get language_arabic_flag;

  /// No description provided for @language_darija_flag.
  ///
  /// In fr, this message translates to:
  /// **'🇲🇦 Darija'**
  String get language_darija_flag;

  /// No description provided for @advertisement_title.
  ///
  /// In fr, this message translates to:
  /// **'Créer une publicité'**
  String get advertisement_title;

  /// No description provided for @advertisement_type_label.
  ///
  /// In fr, this message translates to:
  /// **'Type de publicité'**
  String get advertisement_type_label;

  /// No description provided for @advertisement_type_hint.
  ///
  /// In fr, this message translates to:
  /// **'Sélectionnez un type'**
  String get advertisement_type_hint;

  /// No description provided for @advertisement_plan_label.
  ///
  /// In fr, this message translates to:
  /// **'Plan'**
  String get advertisement_plan_label;

  /// No description provided for @advertisement_plan_hint.
  ///
  /// In fr, this message translates to:
  /// **'Sélectionnez un plan'**
  String get advertisement_plan_hint;

  /// No description provided for @advertisement_property_label.
  ///
  /// In fr, this message translates to:
  /// **'Propriété'**
  String get advertisement_property_label;

  /// No description provided for @advertisement_property_hint.
  ///
  /// In fr, this message translates to:
  /// **'Sélectionnez une propriété'**
  String get advertisement_property_hint;

  /// No description provided for @advertisement_title_label.
  ///
  /// In fr, this message translates to:
  /// **'Titre'**
  String get advertisement_title_label;

  /// No description provided for @advertisement_title_hint.
  ///
  /// In fr, this message translates to:
  /// **'Titre de la publicité'**
  String get advertisement_title_hint;

  /// No description provided for @advertisement_description_label.
  ///
  /// In fr, this message translates to:
  /// **'Description'**
  String get advertisement_description_label;

  /// No description provided for @advertisement_description_hint.
  ///
  /// In fr, this message translates to:
  /// **'Description détaillée'**
  String get advertisement_description_hint;

  /// No description provided for @advertisement_budget_label.
  ///
  /// In fr, this message translates to:
  /// **'Budget (DH)'**
  String get advertisement_budget_label;

  /// No description provided for @advertisement_budget_hint.
  ///
  /// In fr, this message translates to:
  /// **'100'**
  String get advertisement_budget_hint;

  /// No description provided for @advertisement_budget_required.
  ///
  /// In fr, this message translates to:
  /// **'Budget requis'**
  String get advertisement_budget_required;

  /// No description provided for @advertisement_budget_min.
  ///
  /// In fr, this message translates to:
  /// **'Minimum 100 DH'**
  String get advertisement_budget_min;

  /// No description provided for @advertisement_start_date_label.
  ///
  /// In fr, this message translates to:
  /// **'Date de début'**
  String get advertisement_start_date_label;

  /// No description provided for @advertisement_end_date_label.
  ///
  /// In fr, this message translates to:
  /// **'Date de fin'**
  String get advertisement_end_date_label;

  /// No description provided for @advertisement_select_dates_error.
  ///
  /// In fr, this message translates to:
  /// **'Veuillez sélectionner les dates de début et de fin'**
  String get advertisement_select_dates_error;

  /// No description provided for @advertisement_end_date_after_start_error.
  ///
  /// In fr, this message translates to:
  /// **'La date de fin doit être après la date de début'**
  String get advertisement_end_date_after_start_error;

  /// No description provided for @advertisement_select_plan_error.
  ///
  /// In fr, this message translates to:
  /// **'Veuillez sélectionner un plan'**
  String get advertisement_select_plan_error;

  /// No description provided for @advertisement_select_property_error.
  ///
  /// In fr, this message translates to:
  /// **'Veuillez sélectionner une propriété'**
  String get advertisement_select_property_error;

  /// No description provided for @advertisement_submit.
  ///
  /// In fr, this message translates to:
  /// **'Envoyer la demande'**
  String get advertisement_submit;

  /// No description provided for @advertisement_success.
  ///
  /// In fr, this message translates to:
  /// **'Demande de publicité envoyée avec succès'**
  String get advertisement_success;

  /// No description provided for @property_form_edit_title.
  ///
  /// In fr, this message translates to:
  /// **'Modifier'**
  String get property_form_edit_title;

  /// No description provided for @property_form_create_title.
  ///
  /// In fr, this message translates to:
  /// **'Nouvelle propriété'**
  String get property_form_create_title;

  /// No description provided for @property_form_step_info.
  ///
  /// In fr, this message translates to:
  /// **'Informations'**
  String get property_form_step_info;

  /// No description provided for @property_form_step_features.
  ///
  /// In fr, this message translates to:
  /// **'Caractéristiques'**
  String get property_form_step_features;

  /// No description provided for @property_form_step_amenities.
  ///
  /// In fr, this message translates to:
  /// **'Équipements'**
  String get property_form_step_amenities;

  /// No description provided for @property_form_step_environment.
  ///
  /// In fr, this message translates to:
  /// **'Environnement'**
  String get property_form_step_environment;

  /// No description provided for @property_form_step_media.
  ///
  /// In fr, this message translates to:
  /// **'Médias'**
  String get property_form_step_media;

  /// No description provided for @property_form_previous.
  ///
  /// In fr, this message translates to:
  /// **'Précédent'**
  String get property_form_previous;

  /// No description provided for @property_form_next.
  ///
  /// In fr, this message translates to:
  /// **'Suivant'**
  String get property_form_next;

  /// No description provided for @property_form_save.
  ///
  /// In fr, this message translates to:
  /// **'Enregistrer'**
  String get property_form_save;

  /// No description provided for @property_form_fill_required.
  ///
  /// In fr, this message translates to:
  /// **'Veuillez remplir tous les champs obligatoires'**
  String get property_form_fill_required;

  /// No description provided for @property_form_title_label.
  ///
  /// In fr, this message translates to:
  /// **'Titre'**
  String get property_form_title_label;

  /// No description provided for @property_form_description_label.
  ///
  /// In fr, this message translates to:
  /// **'Description *'**
  String get property_form_description_label;

  /// No description provided for @property_form_description_required.
  ///
  /// In fr, this message translates to:
  /// **'Description requise'**
  String get property_form_description_required;

  /// No description provided for @property_form_description_generated.
  ///
  /// In fr, this message translates to:
  /// **'Description générée avec succès'**
  String get property_form_description_generated;

  /// No description provided for @property_form_generate_description.
  ///
  /// In fr, this message translates to:
  /// **'Générer une description IA'**
  String get property_form_generate_description;

  /// No description provided for @property_form_price_label.
  ///
  /// In fr, this message translates to:
  /// **'Prix (DH) *'**
  String get property_form_price_label;

  /// No description provided for @property_form_price_suggestion.
  ///
  /// In fr, this message translates to:
  /// **'Suggestion de prix IA'**
  String get property_form_price_suggestion;

  /// No description provided for @property_form_price_suggestion_title.
  ///
  /// In fr, this message translates to:
  /// **'Suggestion de prix IA'**
  String get property_form_price_suggestion_title;

  /// No description provided for @property_form_apply_price.
  ///
  /// In fr, this message translates to:
  /// **'Appliquer ce prix'**
  String get property_form_apply_price;

  /// No description provided for @property_form_close.
  ///
  /// In fr, this message translates to:
  /// **'Fermer'**
  String get property_form_close;

  /// No description provided for @property_form_price_range.
  ///
  /// In fr, this message translates to:
  /// **'Fourchette: {min} - {max}'**
  String property_form_price_range(Object max, Object min);

  /// No description provided for @property_form_city_label.
  ///
  /// In fr, this message translates to:
  /// **'Ville'**
  String get property_form_city_label;

  /// No description provided for @property_form_address_label.
  ///
  /// In fr, this message translates to:
  /// **'Adresse'**
  String get property_form_address_label;

  /// No description provided for @property_form_type_label.
  ///
  /// In fr, this message translates to:
  /// **'Type'**
  String get property_form_type_label;

  /// No description provided for @property_form_category_label.
  ///
  /// In fr, this message translates to:
  /// **'Catégorie'**
  String get property_form_category_label;

  /// No description provided for @property_form_surface_label.
  ///
  /// In fr, this message translates to:
  /// **'Surface (m²)'**
  String get property_form_surface_label;

  /// No description provided for @property_form_rooms_label.
  ///
  /// In fr, this message translates to:
  /// **'Pièces'**
  String get property_form_rooms_label;

  /// No description provided for @property_form_bedrooms_label.
  ///
  /// In fr, this message translates to:
  /// **'Chambres'**
  String get property_form_bedrooms_label;

  /// No description provided for @property_form_bathrooms_label.
  ///
  /// In fr, this message translates to:
  /// **'Salles de bain'**
  String get property_form_bathrooms_label;

  /// No description provided for @property_form_floor_label.
  ///
  /// In fr, this message translates to:
  /// **'Étage'**
  String get property_form_floor_label;

  /// No description provided for @property_form_condition_label.
  ///
  /// In fr, this message translates to:
  /// **'État'**
  String get property_form_condition_label;

  /// No description provided for @property_form_furnished.
  ///
  /// In fr, this message translates to:
  /// **'Meublé'**
  String get property_form_furnished;

  /// No description provided for @property_form_get_location.
  ///
  /// In fr, this message translates to:
  /// **'Obtenir la position GPS'**
  String get property_form_get_location;

  /// No description provided for @property_form_add_photos.
  ///
  /// In fr, this message translates to:
  /// **'Ajouter des photos'**
  String get property_form_add_photos;

  /// No description provided for @property_form_add_video.
  ///
  /// In fr, this message translates to:
  /// **'Ajouter une vidéo'**
  String get property_form_add_video;

  /// No description provided for @property_form_video_selected.
  ///
  /// In fr, this message translates to:
  /// **'Vidéo sélectionnée'**
  String get property_form_video_selected;

  /// No description provided for @property_form_existing_images.
  ///
  /// In fr, this message translates to:
  /// **'Images existantes'**
  String get property_form_existing_images;

  /// No description provided for @property_form_new_images.
  ///
  /// In fr, this message translates to:
  /// **'Nouvelles images'**
  String get property_form_new_images;

  /// No description provided for @property_form_amenity_parking.
  ///
  /// In fr, this message translates to:
  /// **'Parking'**
  String get property_form_amenity_parking;

  /// No description provided for @property_form_amenity_pool.
  ///
  /// In fr, this message translates to:
  /// **'Piscine'**
  String get property_form_amenity_pool;

  /// No description provided for @property_form_amenity_garden.
  ///
  /// In fr, this message translates to:
  /// **'Jardin'**
  String get property_form_amenity_garden;

  /// No description provided for @property_form_amenity_ac.
  ///
  /// In fr, this message translates to:
  /// **'Climatisation'**
  String get property_form_amenity_ac;

  /// No description provided for @property_form_amenity_internet.
  ///
  /// In fr, this message translates to:
  /// **'WiFi'**
  String get property_form_amenity_internet;

  /// No description provided for @property_form_amenity_security.
  ///
  /// In fr, this message translates to:
  /// **'Sécurité'**
  String get property_form_amenity_security;

  /// No description provided for @property_form_amenity_balcony.
  ///
  /// In fr, this message translates to:
  /// **'Balcon'**
  String get property_form_amenity_balcony;

  /// No description provided for @property_form_amenity_elevator.
  ///
  /// In fr, this message translates to:
  /// **'Ascenseur'**
  String get property_form_amenity_elevator;

  /// No description provided for @property_form_env_cityCenter.
  ///
  /// In fr, this message translates to:
  /// **'Centre-ville'**
  String get property_form_env_cityCenter;

  /// No description provided for @property_form_env_nearSchool.
  ///
  /// In fr, this message translates to:
  /// **'École'**
  String get property_form_env_nearSchool;

  /// No description provided for @property_form_env_nearUniversity.
  ///
  /// In fr, this message translates to:
  /// **'Université'**
  String get property_form_env_nearUniversity;

  /// No description provided for @property_form_env_nearMosque.
  ///
  /// In fr, this message translates to:
  /// **'Mosquée'**
  String get property_form_env_nearMosque;

  /// No description provided for @property_form_env_nearHospital.
  ///
  /// In fr, this message translates to:
  /// **'Hôpital'**
  String get property_form_env_nearHospital;

  /// No description provided for @property_form_env_nearMarket.
  ///
  /// In fr, this message translates to:
  /// **'Marché'**
  String get property_form_env_nearMarket;

  /// No description provided for @property_form_env_nearBus.
  ///
  /// In fr, this message translates to:
  /// **'Bus'**
  String get property_form_env_nearBus;

  /// No description provided for @property_form_env_nearTram.
  ///
  /// In fr, this message translates to:
  /// **'Tramway'**
  String get property_form_env_nearTram;

  /// No description provided for @property_form_env_nearTrainStation.
  ///
  /// In fr, this message translates to:
  /// **'Gare'**
  String get property_form_env_nearTrainStation;

  /// No description provided for @property_form_env_popularArea.
  ///
  /// In fr, this message translates to:
  /// **'Populaire'**
  String get property_form_env_popularArea;

  /// No description provided for @property_form_env_modernArea.
  ///
  /// In fr, this message translates to:
  /// **'Moderne'**
  String get property_form_env_modernArea;

  /// No description provided for @property_form_env_quietArea.
  ///
  /// In fr, this message translates to:
  /// **'Calme'**
  String get property_form_env_quietArea;

  /// No description provided for @property_form_env_familyArea.
  ///
  /// In fr, this message translates to:
  /// **'Familial'**
  String get property_form_env_familyArea;

  /// No description provided for @property_form_env_gardenView.
  ///
  /// In fr, this message translates to:
  /// **'Vue jardin'**
  String get property_form_env_gardenView;

  /// No description provided for @property_form_env_streetView.
  ///
  /// In fr, this message translates to:
  /// **'Vue rue'**
  String get property_form_env_streetView;

  /// No description provided for @property_form_env_seaView.
  ///
  /// In fr, this message translates to:
  /// **'Vue mer'**
  String get property_form_env_seaView;

  /// No description provided for @property_create_success.
  ///
  /// In fr, this message translates to:
  /// **'Propriété créée avec succès'**
  String get property_create_success;

  /// No description provided for @property_update_success.
  ///
  /// In fr, this message translates to:
  /// **'Propriété mise à jour'**
  String get property_update_success;

  /// No description provided for @property_detail_schedule_visit.
  ///
  /// In fr, this message translates to:
  /// **'Planifier une visite'**
  String get property_detail_schedule_visit;

  /// No description provided for @property_detail_original_price.
  ///
  /// In fr, this message translates to:
  /// **'Au lieu de {price}'**
  String property_detail_original_price(Object price);

  /// No description provided for @property_detail_reviews_title.
  ///
  /// In fr, this message translates to:
  /// **'Avis'**
  String get property_detail_reviews_title;

  /// No description provided for @property_detail_reviews_error.
  ///
  /// In fr, this message translates to:
  /// **'Erreur lors du chargement des avis'**
  String get property_detail_reviews_error;

  /// No description provided for @property_detail_no_reviews.
  ///
  /// In fr, this message translates to:
  /// **'Aucun avis pour le moment. Soyez le premier !'**
  String get property_detail_no_reviews;

  /// No description provided for @property_detail_write_review.
  ///
  /// In fr, this message translates to:
  /// **'Écrire un avis'**
  String get property_detail_write_review;

  /// No description provided for @property_detail_login_to_review.
  ///
  /// In fr, this message translates to:
  /// **'Connectez-vous pour écrire un avis'**
  String get property_detail_login_to_review;

  /// No description provided for @property_detail_review_hint.
  ///
  /// In fr, this message translates to:
  /// **'Votre commentaire...'**
  String get property_detail_review_hint;

  /// No description provided for @property_detail_review_send.
  ///
  /// In fr, this message translates to:
  /// **'Envoyer'**
  String get property_detail_review_send;

  /// No description provided for @property_detail_visit_date.
  ///
  /// In fr, this message translates to:
  /// **'Date'**
  String get property_detail_visit_date;

  /// No description provided for @property_detail_visit_time.
  ///
  /// In fr, this message translates to:
  /// **'Heure'**
  String get property_detail_visit_time;

  /// No description provided for @property_detail_visit_name.
  ///
  /// In fr, this message translates to:
  /// **'Nom complet'**
  String get property_detail_visit_name;

  /// No description provided for @property_detail_visit_phone.
  ///
  /// In fr, this message translates to:
  /// **'Téléphone'**
  String get property_detail_visit_phone;

  /// No description provided for @property_detail_visit_notes.
  ///
  /// In fr, this message translates to:
  /// **'Notes (optionnel)'**
  String get property_detail_visit_notes;

  /// No description provided for @property_detail_visit_confirm.
  ///
  /// In fr, this message translates to:
  /// **'Confirmer'**
  String get property_detail_visit_confirm;

  /// No description provided for @property_detail_visit_success.
  ///
  /// In fr, this message translates to:
  /// **'Visite planifiée avec succès'**
  String get property_detail_visit_success;

  /// No description provided for @property_detail_login_required_title.
  ///
  /// In fr, this message translates to:
  /// **'Connexion requise'**
  String get property_detail_login_required_title;

  /// No description provided for @property_detail_login_required_message.
  ///
  /// In fr, this message translates to:
  /// **'Vous devez être connecté pour effectuer cette action.'**
  String get property_detail_login_required_message;

  /// No description provided for @property_detail_login.
  ///
  /// In fr, this message translates to:
  /// **'Se connecter'**
  String get property_detail_login;

  /// No description provided for @property_detail_anonymous.
  ///
  /// In fr, this message translates to:
  /// **'Anonyme'**
  String get property_detail_anonymous;

  /// No description provided for @property_detail_owner_default.
  ///
  /// In fr, this message translates to:
  /// **'Propriétaire'**
  String get property_detail_owner_default;

  /// No description provided for @home_for_you.
  ///
  /// In fr, this message translates to:
  /// **'Pour vous'**
  String get home_for_you;

  /// No description provided for @home_see_more.
  ///
  /// In fr, this message translates to:
  /// **'Voir plus'**
  String get home_see_more;

  /// No description provided for @home_see_all.
  ///
  /// In fr, this message translates to:
  /// **'Voir tous'**
  String get home_see_all;

  /// No description provided for @home_top_owners.
  ///
  /// In fr, this message translates to:
  /// **'Meilleurs propriétaires'**
  String get home_top_owners;

  /// No description provided for @home_site_reviews.
  ///
  /// In fr, this message translates to:
  /// **'Avis sur MAROC-LOC'**
  String get home_site_reviews;

  /// No description provided for @home_leave_review.
  ///
  /// In fr, this message translates to:
  /// **'Laisser un avis'**
  String get home_leave_review;

  /// No description provided for @home_review_title.
  ///
  /// In fr, this message translates to:
  /// **'Donnez votre avis'**
  String get home_review_title;

  /// No description provided for @home_review_name.
  ///
  /// In fr, this message translates to:
  /// **'Votre nom (optionnel)'**
  String get home_review_name;

  /// No description provided for @home_review_comment.
  ///
  /// In fr, this message translates to:
  /// **'Votre commentaire'**
  String get home_review_comment;

  /// No description provided for @home_review_send.
  ///
  /// In fr, this message translates to:
  /// **'Envoyer'**
  String get home_review_send;

  /// No description provided for @home_recently_viewed.
  ///
  /// In fr, this message translates to:
  /// **'Récemment consultés'**
  String get home_recently_viewed;

  /// No description provided for @home_top_badge.
  ///
  /// In fr, this message translates to:
  /// **'Top'**
  String get home_top_badge;

  /// No description provided for @home_per_month.
  ///
  /// In fr, this message translates to:
  /// **' /mois'**
  String get home_per_month;

  /// No description provided for @owners_title.
  ///
  /// In fr, this message translates to:
  /// **'Propriétaires'**
  String get owners_title;

  /// No description provided for @owners_empty.
  ///
  /// In fr, this message translates to:
  /// **'Aucun propriétaire classé'**
  String get owners_empty;

  /// No description provided for @owner_unknown.
  ///
  /// In fr, this message translates to:
  /// **'Inconnu'**
  String get owner_unknown;

  /// No description provided for @owner_properties_count.
  ///
  /// In fr, this message translates to:
  /// **'{count} bien'**
  String owner_properties_count(Object count);

  /// No description provided for @owner_reviews.
  ///
  /// In fr, this message translates to:
  /// **'Avis'**
  String get owner_reviews;

  /// No description provided for @owner_response_rate.
  ///
  /// In fr, this message translates to:
  /// **'Réponse'**
  String get owner_response_rate;

  /// No description provided for @owner_visits.
  ///
  /// In fr, this message translates to:
  /// **'Visites'**
  String get owner_visits;

  /// No description provided for @owner_view_profile.
  ///
  /// In fr, this message translates to:
  /// **'Voir profil'**
  String get owner_view_profile;

  /// No description provided for @owner_view_properties.
  ///
  /// In fr, this message translates to:
  /// **'Biens'**
  String get owner_view_properties;

  /// No description provided for @owner_verified.
  ///
  /// In fr, this message translates to:
  /// **'Vérifié'**
  String get owner_verified;

  /// No description provided for @owner_score.
  ///
  /// In fr, this message translates to:
  /// **'Score'**
  String get owner_score;

  /// No description provided for @owner_properties_title.
  ///
  /// In fr, this message translates to:
  /// **'Biens du propriétaire'**
  String get owner_properties_title;

  /// No description provided for @owner_loading_error.
  ///
  /// In fr, this message translates to:
  /// **'Erreur de chargement'**
  String get owner_loading_error;

  /// No description provided for @owner_not_found.
  ///
  /// In fr, this message translates to:
  /// **'Propriétaire introuvable'**
  String get owner_not_found;

  /// No description provided for @owner_back.
  ///
  /// In fr, this message translates to:
  /// **'Retour'**
  String get owner_back;

  /// No description provided for @owner_stats_properties.
  ///
  /// In fr, this message translates to:
  /// **'Biens'**
  String get owner_stats_properties;

  /// No description provided for @owner_stats_rating.
  ///
  /// In fr, this message translates to:
  /// **'Note'**
  String get owner_stats_rating;

  /// No description provided for @owner_stats_premium.
  ///
  /// In fr, this message translates to:
  /// **'Premium'**
  String get owner_stats_premium;

  /// No description provided for @profile_edit_title.
  ///
  /// In fr, this message translates to:
  /// **'Modifier le profil'**
  String get profile_edit_title;

  /// No description provided for @profile_edit_name.
  ///
  /// In fr, this message translates to:
  /// **'Nom complet'**
  String get profile_edit_name;

  /// No description provided for @profile_edit_email.
  ///
  /// In fr, this message translates to:
  /// **'Email'**
  String get profile_edit_email;

  /// No description provided for @profile_edit_phone.
  ///
  /// In fr, this message translates to:
  /// **'Téléphone'**
  String get profile_edit_phone;

  /// No description provided for @profile_edit_whatsapp.
  ///
  /// In fr, this message translates to:
  /// **'WhatsApp'**
  String get profile_edit_whatsapp;

  /// No description provided for @profile_edit_city.
  ///
  /// In fr, this message translates to:
  /// **'Ville'**
  String get profile_edit_city;

  /// No description provided for @profile_edit_preferred_city.
  ///
  /// In fr, this message translates to:
  /// **'Ville préférée'**
  String get profile_edit_preferred_city;

  /// No description provided for @profile_edit_save.
  ///
  /// In fr, this message translates to:
  /// **'Enregistrer'**
  String get profile_edit_save;

  /// No description provided for @profile_update_success.
  ///
  /// In fr, this message translates to:
  /// **'Profil mis à jour'**
  String get profile_update_success;

  /// No description provided for @register_first_name.
  ///
  /// In fr, this message translates to:
  /// **'Prénom'**
  String get register_first_name;

  /// No description provided for @register_last_name.
  ///
  /// In fr, this message translates to:
  /// **'Nom'**
  String get register_last_name;

  /// No description provided for @register_city_label.
  ///
  /// In fr, this message translates to:
  /// **'Ville'**
  String get register_city_label;

  /// No description provided for @register_city_hint.
  ///
  /// In fr, this message translates to:
  /// **'Sélectionnez une ville'**
  String get register_city_hint;

  /// No description provided for @cities_title.
  ///
  /// In fr, this message translates to:
  /// **'Toutes les villes'**
  String get cities_title;

  /// No description provided for @cities_empty.
  ///
  /// In fr, this message translates to:
  /// **'Aucune ville disponible'**
  String get cities_empty;

  /// No description provided for @onboarding_welcome_title.
  ///
  /// In fr, this message translates to:
  /// **'Bienvenue sur MAROC-LOC'**
  String get onboarding_welcome_title;

  /// No description provided for @onboarding_welcome_desc.
  ///
  /// In fr, this message translates to:
  /// **'Trouvez, louez et vivez dans les meilleurs biens immobiliers du Maroc.'**
  String get onboarding_welcome_desc;

  /// No description provided for @favorites_login_required.
  ///
  /// In fr, this message translates to:
  /// **'Se reconnecter'**
  String get favorites_login_required;

  /// No description provided for @home_recommendations_ai_badge.
  ///
  /// In fr, this message translates to:
  /// **'IA'**
  String get home_recommendations_ai_badge;

  /// No description provided for @advertisement_payment_method_label.
  ///
  /// In fr, this message translates to:
  /// **'Mode de paiement'**
  String get advertisement_payment_method_label;

  /// No description provided for @advertisement_payment_method_hint.
  ///
  /// In fr, this message translates to:
  /// **'Choisir un mode de paiement'**
  String get advertisement_payment_method_hint;

  /// No description provided for @advertisement_payment_method_stripe.
  ///
  /// In fr, this message translates to:
  /// **'Stripe / Carte'**
  String get advertisement_payment_method_stripe;

  /// No description provided for @advertisement_payment_method_cmi.
  ///
  /// In fr, this message translates to:
  /// **'CMI'**
  String get advertisement_payment_method_cmi;

  /// No description provided for @property_whatsapp_default_message.
  ///
  /// In fr, this message translates to:
  /// **'Bonjour, je suis intéressé par votre bien'**
  String get property_whatsapp_default_message;

  /// No description provided for @property_form_location_coordinates.
  ///
  /// In fr, this message translates to:
  /// **'Lat: {lat}, Lng: {lng}'**
  String property_form_location_coordinates(Object lat, Object lng);

  /// No description provided for @my_reservations_title.
  ///
  /// In fr, this message translates to:
  /// **'Mes réservations'**
  String get my_reservations_title;

  /// No description provided for @my_reservations_empty.
  ///
  /// In fr, this message translates to:
  /// **'Vous n\'avez aucune réservation ou achat pour le moment.'**
  String get my_reservations_empty;

  /// No description provided for @my_reservations_type.
  ///
  /// In fr, this message translates to:
  /// **'Type'**
  String get my_reservations_type;

  /// No description provided for @my_reservations_date.
  ///
  /// In fr, this message translates to:
  /// **'Date'**
  String get my_reservations_date;

  /// No description provided for @property_untitled.
  ///
  /// In fr, this message translates to:
  /// **'Bien sans titre'**
  String get property_untitled;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['ar', 'en', 'fr'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'ar':
      return AppLocalizationsAr();
    case 'en':
      return AppLocalizationsEn();
    case 'fr':
      return AppLocalizationsFr();
  }

  throw FlutterError(
      'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
      'an issue with the localizations generation tool. Please file an issue '
      'on GitHub with a reproducible sample app and the gen-l10n configuration '
      'that was used.');
}
