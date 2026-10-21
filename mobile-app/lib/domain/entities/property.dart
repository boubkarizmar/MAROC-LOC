import 'package:equatable/equatable.dart';

class Property extends Equatable {
  final int id;
  final String title;
  final String description;
  final double price;
  final String city;
  final String address;
  final String type;
  final String category;
  final String status;
  final double surface;
  final int rooms;
  final int? bedrooms;
  final int? bathrooms;
  final int? floorNumber;
  final int? totalFloors;
  final int? buildingAge;
  final int? constructionYear;
  final String? condition;
  final bool? furnished;
  final bool? hasElevator;
  final bool? hasParking;
  final bool? hasPool;
  final bool? hasGarden;
  final bool? hasAirConditioning;
  final bool? hasInternet;
  final bool? hasSecurity;
  final bool? hasBalcony;
  final bool? petAllowed;
  final bool? cityCenter;
  final bool? nearSchool;
  final bool? nearUniversity;
  final bool? nearMosque;
  final bool? nearHospital;
  final bool? nearMarket;
  final bool? nearTram;
  final bool? nearBus;
  final bool? nearTrainStation;
  final bool? popularArea;
  final bool? modernArea;
  final bool? quietArea;
  final bool? familyArea;
  final String? sunDirection;
  final bool? gardenView;
  final bool? streetView;
  final bool? seaView;
  final List<String>? images;
  final String? imageUrl;
  final String? videoTour;
  final double? latitude;
  final double? longitude;
  final int? ownerId;
  final String? ownerName;
  final String? phoneNumber;
  final String? whatsappNumber;
  final double? additionalFees;
  final double? discountPercentage;
  final String? paymentMethod;
  final String? billingPeriod;
  final String? createdAt;
  final String? updatedAt;
  final String? approvedAt;
  final String? rejectionReason;
  final bool? isVerified;
  final int? viewCount;

  const Property({
    required this.id,
    required this.title,
    required this.description,
    required this.price,
    required this.city,
    required this.address,
    required this.type,
    required this.category,
    required this.status,
    required this.surface,
    required this.rooms,
    this.bedrooms,
    this.bathrooms,
    this.floorNumber,
    this.totalFloors,
    this.buildingAge,
    this.constructionYear,
    this.condition,
    this.furnished,
    this.hasElevator,
    this.hasParking,
    this.hasPool,
    this.hasGarden,
    this.hasAirConditioning,
    this.hasInternet,
    this.hasSecurity,
    this.hasBalcony,
    this.petAllowed,
    this.cityCenter,
    this.nearSchool,
    this.nearUniversity,
    this.nearMosque,
    this.nearHospital,
    this.nearMarket,
    this.nearTram,
    this.nearBus,
    this.nearTrainStation,
    this.popularArea,
    this.modernArea,
    this.quietArea,
    this.familyArea,
    this.sunDirection,
    this.gardenView,
    this.streetView,
    this.seaView,
    this.images,
    this.imageUrl,
    this.videoTour,
    this.latitude,
    this.longitude,
    this.ownerId,
    this.ownerName,
    this.phoneNumber,
    this.whatsappNumber,
    this.additionalFees,
    this.discountPercentage,
    this.paymentMethod,
    this.billingPeriod,
    this.createdAt,
    this.updatedAt,
    this.approvedAt,
    this.rejectionReason,
    this.isVerified,
    this.viewCount,
  });

  double? get finalPrice {
    final fees = additionalFees ?? 0.0;
    final discount = discountPercentage ?? 0.0;
    return price + fees - (price * discount / 100);
  }

  double? get pricePerSquareMeter {
    final fp = finalPrice;
    if (fp != null && surface > 0) {
      return fp / surface;
    }
    return null;
  }

  String? get coverImage {
    if (images != null && images!.isNotEmpty) {
      return images!.first;
    }
    if (imageUrl != null && imageUrl!.isNotEmpty) {
      return imageUrl;
    }
    return null;
  }

  @override
  List<Object?> get props => [id];
}
