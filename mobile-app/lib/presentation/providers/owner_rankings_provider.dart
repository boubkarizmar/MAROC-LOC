import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../services/property_service.dart';
import 'property_provider.dart';

final ownerRankingsProvider =
    StateNotifierProvider<OwnerRankingsNotifier, List<dynamic>>((ref) {
  return OwnerRankingsNotifier(ref.read(propertyServiceProvider));
});

class OwnerRankingsNotifier extends StateNotifier<List<dynamic>> {
  final PropertyService _service;

  OwnerRankingsNotifier(this._service) : super([]);

  Future<void> loadRankings() async {
    try {
      final rankings = await _service.getOwnerRankings();
      state = rankings;
    } catch (e) {
      state = [];
    }
  }
}
