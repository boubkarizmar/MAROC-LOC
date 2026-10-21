class PropertyVisitModel {
  final int id;
  final int? propertyId;
  final String? propertyTitle;
  final String? visitDate;
  final String? visitTime;
  final String status;

  PropertyVisitModel({
    required this.id,
    this.propertyId,
    this.propertyTitle,
    this.visitDate,
    this.visitTime,
    required this.status,
  });

  factory PropertyVisitModel.fromJson(Map<String, dynamic> json) {
    return PropertyVisitModel(
      id: json['id'] ?? 0,
      propertyId: json['propertyId'],
      propertyTitle: json['propertyTitle'],
      visitDate: json['visitDate'],
      visitTime: json['visitTime'],
      status: json['status'] ?? 'PENDING',
    );
  }
}
