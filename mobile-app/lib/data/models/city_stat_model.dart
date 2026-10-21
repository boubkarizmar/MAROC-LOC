class CityStatModel {
  final String city;
  final int propertyCount;
  final double averagePrice;
  final String? imageUrl;

  const CityStatModel({
    required this.city,
    required this.propertyCount,
    required this.averagePrice,
    this.imageUrl,
  });

  factory CityStatModel.fromJson(Map<String, dynamic> json) {
    return CityStatModel(
      city: json['city'] as String,
      propertyCount: json['propertyCount'] as int? ?? 0,
      averagePrice: (json['averagePrice'] as num?)?.toDouble() ?? 0.0,
      imageUrl: json['imageUrl'] as String?,
    );
  }
}
