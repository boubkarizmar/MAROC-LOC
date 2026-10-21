import 'package:flutter_test/flutter_test.dart';
import 'package:marocloc_mobile/presentation/providers/property_provider.dart';
import 'package:marocloc_mobile/data/models/property_model.dart';

void main() {
  group('PropertyState', () {
    test('initial state has empty lists', () {
      final state = PropertyState();
      expect(state.properties, isEmpty);
      expect(state.topRanked, isEmpty);
      expect(state.myProperties, isEmpty);
      expect(state.similarProperties, isEmpty);
      expect(state.isLoading, false);
      expect(state.hasMore, true);
    });

    test('copyWith updates properties list', () {
      final property = PropertyModel(
        id: 1,
        title: 'Test',
        description: 'Desc',
        price: 1000,
        city: 'Casablanca',
        address: 'Address',
        type: 'RENT',
        category: 'APARTMENT',
        status: 'AVAILABLE',
        surface: 100,
        rooms: 3,
      );
      final state = PropertyState();
      final newState = state.copyWith(properties: [property]);
      expect(newState.properties.length, 1);
      expect(newState.properties.first.id, 1);
    });

    test('clearSelected removes selected property', () {
      final property = PropertyModel(
        id: 1,
        title: 'Test',
        description: 'Desc',
        price: 1000,
        city: 'Casablanca',
        address: 'Address',
        type: 'RENT',
        category: 'APARTMENT',
        status: 'AVAILABLE',
        surface: 100,
        rooms: 3,
      );
      final state = PropertyState(selectedProperty: property).copyWith(clearSelected: true);
      expect(state.selectedProperty, null);
    });
  });
}
