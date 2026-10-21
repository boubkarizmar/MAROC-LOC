// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appName => 'MAROC-LOC';

  @override
  String get loading => 'Loading...';

  @override
  String get error => 'An error occurred';

  @override
  String get retry => 'Retry';

  @override
  String get cancel => 'Cancel';

  @override
  String get confirm => 'Confirm';

  @override
  String get save => 'Save';

  @override
  String get delete => 'Delete';

  @override
  String get edit => 'Edit';

  @override
  String get search => 'Search';

  @override
  String get submit => 'Submit';

  @override
  String get close => 'Close';

  @override
  String get back => 'Back';

  @override
  String get next => 'Next';

  @override
  String get previous => 'Previous';

  @override
  String get explore => 'Explore';

  @override
  String get add => 'Add';

  @override
  String get yes => 'Yes';

  @override
  String get no => 'No';

  @override
  String get nav_home => 'Home';

  @override
  String get nav_search => 'Search';

  @override
  String get nav_favorites => 'Favorites';

  @override
  String get nav_profile => 'Profile';

  @override
  String get login_title => 'Login';

  @override
  String get login_email_label => 'Email';

  @override
  String get login_email_hint => 'Enter your email';

  @override
  String get login_email_required => 'Email is required';

  @override
  String get login_email_invalid => 'Invalid email';

  @override
  String get login_password_label => 'Password';

  @override
  String get login_password_hint => 'Enter your password';

  @override
  String get login_password_required => 'Password is required';

  @override
  String get login_password_min => 'Minimum 6 characters';

  @override
  String get login_forgot_password => 'Forgot password?';

  @override
  String get login_button => 'Sign in';

  @override
  String get login_no_account => 'Don\'t have an account?';

  @override
  String get login_register_link => 'Sign up';

  @override
  String get login_error_invalid => 'Invalid email or password';

  @override
  String get register_title => 'Register';

  @override
  String get register_full_name_label => 'Full name';

  @override
  String get register_full_name_required => 'Name is required';

  @override
  String get register_email_label => 'Email';

  @override
  String get register_email_required => 'Email is required';

  @override
  String get register_email_invalid => 'Invalid email';

  @override
  String get register_phone_label => 'Phone';

  @override
  String get register_phone_required => 'Phone is required';

  @override
  String get register_phone_hint => '06XXXXXXXX';

  @override
  String get register_account_type_label => 'Account type';

  @override
  String get register_account_type_tenant => 'I\'m looking for a property';

  @override
  String get register_account_type_owner => 'I\'m posting a listing';

  @override
  String get register_password_label => 'Password';

  @override
  String get register_password_min => 'Minimum 6 characters';

  @override
  String get register_password_confirm_label => 'Confirm password';

  @override
  String get register_password_confirm_required => 'Confirmation required';

  @override
  String get register_password_mismatch => 'Passwords do not match';

  @override
  String get register_button => 'Sign up';

  @override
  String get register_has_account => 'Already have an account?';

  @override
  String get register_login_link => 'Sign in';

  @override
  String get register_success => 'Registration successful! Please sign in.';

  @override
  String get register_error => 'Registration failed. Please try again.';

  @override
  String get home_app_bar_title => 'MAROC-LOC';

  @override
  String get home_hero_badge => 'Smart real estate';

  @override
  String get home_hero_title => 'Find your ideal\nproperty in Morocco';

  @override
  String get home_search_hint => 'Search for a property, city...';

  @override
  String get home_stats_properties => 'Properties';

  @override
  String get home_stats_users => 'Users';

  @override
  String get home_stats_cities => 'Cities';

  @override
  String get home_category_title => 'Explore by category';

  @override
  String get home_selection_title => 'Selection of the moment';

  @override
  String get home_sponsored_badge => 'Sponsored';

  @override
  String get home_recommendations_title => 'Recommendations';

  @override
  String get home_feed_title => 'Available properties';

  @override
  String get home_feed_results => 'results';

  @override
  String get home_feed_error => 'Loading error';

  @override
  String get home_feed_empty => 'No properties available';

  @override
  String get home_feed_empty_desc => 'Listings will appear here.';

  @override
  String get home_cities_title => 'Explore by city';

  @override
  String get property_type_rent => 'Rent';

  @override
  String get property_type_buy => 'Buy';

  @override
  String get property_type_mortgage => 'Mortgage';

  @override
  String get property_not_found => 'Property not found';

  @override
  String get property_verified => 'Verified';

  @override
  String get property_currency => 'MAD';

  @override
  String get property_per_month => '/month';

  @override
  String get property_characteristics => 'Characteristics';

  @override
  String get property_feature_parking => 'Parking';

  @override
  String get property_feature_pool => 'Pool';

  @override
  String get property_feature_furnished => 'Furnished';

  @override
  String get property_feature_ac => 'AC';

  @override
  String get property_feature_garden => 'Garden';

  @override
  String get property_feature_elevator => 'Elevator';

  @override
  String get property_description => 'Description';

  @override
  String get property_message_cta => 'Message';

  @override
  String get property_call_cta => 'Call';

  @override
  String get property_detail_reserve => 'Reserve';

  @override
  String get property_detail_buy => 'Buy';

  @override
  String get property_detail_rahn => 'Rahn info';

  @override
  String get property_detail_rahn_info =>
      'This property is offered under Rahn (mortgage/credit-bail). To proceed, please contact the owner directly to discuss terms and required documents.';

  @override
  String get property_detail_view_owner_profile => 'View owner profile';

  @override
  String get property_price_per_square_meter => 'Price per m²';

  @override
  String property_whatsapp_message(Object title) {
    return 'Hello, I am interested in your property: $title';
  }

  @override
  String get payment_reservation_description => 'Property reservation deposit';

  @override
  String get payment_purchase_description => 'Property purchase payment';

  @override
  String get property_retry => 'Retry';

  @override
  String get property_surface_unit => ' m²';

  @override
  String get property_rooms_unit => ' rooms';

  @override
  String get property_bedrooms_unit => ' br';

  @override
  String get property_bathrooms_unit => ' bath';

  @override
  String get favorites_title => 'My favorites';

  @override
  String get favorites_empty_title => 'Your selection is empty';

  @override
  String get favorites_empty_desc => 'Save the properties you like.';

  @override
  String get favorites_explore => 'Explore';

  @override
  String get messages_title => 'Messages';

  @override
  String get messages_search_hint => 'Search conversations...';

  @override
  String get messages_empty_title => 'No messages yet';

  @override
  String get messages_empty_desc => 'Contact an owner to get started.';

  @override
  String get notifications_title => 'Notifications';

  @override
  String get notifications_mark_all_read => 'Mark all as read';

  @override
  String get notifications_empty => 'No notifications';

  @override
  String get onboarding_title_1 => 'Welcome to MAROC-LOC';

  @override
  String get onboarding_desc_1 =>
      'Morocco\'s intelligent real estate platform.';

  @override
  String get onboarding_title_2 => 'Smart search';

  @override
  String get onboarding_desc_2 => 'Use our AI to search in natural language.';

  @override
  String get onboarding_title_3 => 'Save your favorites';

  @override
  String get onboarding_desc_3 => 'Create your personal selection.';

  @override
  String get onboarding_title_4 => 'Personal AI assistant';

  @override
  String get onboarding_desc_4 =>
      'Our assistant speaks French, Arabic and Darija.';

  @override
  String get onboarding_title_5 => 'Go premium';

  @override
  String get onboarding_desc_5 => 'Unlock AI analytics and premium visibility.';

  @override
  String get onboarding_skip => 'Skip';

  @override
  String get onboarding_previous => 'Previous';

  @override
  String get onboarding_next => 'Next';

  @override
  String get onboarding_start => 'Start';

  @override
  String get onboarding_finish => 'Finish';

  @override
  String get splash_title => 'MAROC-LOC';

  @override
  String get splash_tagline => 'AI · REAL ESTATE · MOROCCO';

  @override
  String get splash_init => 'Initializing...';

  @override
  String get splash_connecting => 'Connecting to server...';

  @override
  String get splash_loading_data => 'Loading data...';

  @override
  String get splash_preparing => 'Preparing interface...';

  @override
  String get splash_starting => 'Starting...';

  @override
  String get empty_property_title => 'No properties';

  @override
  String get empty_property_desc => 'Start by adding your first property.';

  @override
  String get empty_search_title => 'No results';

  @override
  String get empty_search_desc => 'Try different search criteria.';

  @override
  String get empty_generic_title => 'Nothing to display';

  @override
  String get empty_generic_desc => 'Come back later.';

  @override
  String get error_loading => 'Loading error';

  @override
  String get error_search => 'Search error';

  @override
  String get error_not_found => 'Property not found';

  @override
  String get analytics_title => 'AI Analytics';

  @override
  String get analytics_intents => 'Intent Distribution';

  @override
  String get analytics_languages => 'Languages Used';

  @override
  String analytics_timeline(Object days) {
    return 'Activity ($days days)';
  }

  @override
  String get analytics_conversations => 'Conversations';

  @override
  String get analytics_messages => 'Messages';

  @override
  String get analytics_avg_time => 'Avg time';

  @override
  String get analytics_recommendations => 'Recommendations';

  @override
  String get analytics_no_intent_data => 'No intent data available';

  @override
  String get analytics_no_language_data => 'No language data available';

  @override
  String get analytics_no_timeline_data => 'No historical data available';

  @override
  String get chat_typing => 'Typing...';

  @override
  String get chat_online => 'Online';

  @override
  String get chat_offline => 'Offline';

  @override
  String get chat_placeholder => 'Write a message...';

  @override
  String get chat_reset_title => 'New conversation';

  @override
  String get chat_reset_confirm => 'Do you want to clear the conversation?';

  @override
  String get chat_speak => 'Listen';

  @override
  String get today => 'Today';

  @override
  String get yesterday => 'Yesterday';

  @override
  String get chatbot_typing => 'AI is thinking...';

  @override
  String get property_video_visit => 'Video Tour';

  @override
  String get property_start_video => 'Start Video Tour';

  @override
  String get property_whatsapp => 'WhatsApp';

  @override
  String get property_similar => 'Similar Properties';

  @override
  String get dashboard_title => 'Dashboard';

  @override
  String get dashboard_no_properties => 'No properties';

  @override
  String get dashboard_add_property => 'Add a property';

  @override
  String get dashboard_confirm_delete => 'Confirm deletion';

  @override
  String get visits_title => 'Visits';

  @override
  String get visits_empty => 'No scheduled visits';

  @override
  String get visits_schedule => 'Schedule a visit';

  @override
  String get visits_status_pending => 'Pending';

  @override
  String get visits_status_confirmed => 'Confirmed';

  @override
  String get visits_status_completed => 'Completed';

  @override
  String get visits_status_cancelled => 'Cancelled';

  @override
  String get visits_cancel => 'Cancel';

  @override
  String get visits_reschedule => 'Reschedule';

  @override
  String get admin_title => 'Administration';

  @override
  String get admin_users => 'Users';

  @override
  String get admin_properties => 'Properties';

  @override
  String get admin_pending_approval => 'Pending approval';

  @override
  String get admin_stats => 'Statistics';

  @override
  String get admin_platform_overview => 'Platform overview';

  @override
  String get chatbot_hello =>
      'Hello! I am your real estate assistant. How can I help you?';

  @override
  String get chatbot_property_search => 'Search for a property';

  @override
  String get chatbot_price_check => 'Check prices';

  @override
  String get chatbot_view_detail => 'View detail';

  @override
  String get admin_monthly_trends => 'Monthly Trends';

  @override
  String get admin_yearly_trends => 'Yearly Trends';

  @override
  String get admin_no_monthly_data => 'No monthly data';

  @override
  String get admin_no_yearly_data => 'No yearly data';

  @override
  String get admin_users_short => 'Users';

  @override
  String get admin_properties_short => 'Properties';

  @override
  String get admin_reviews_short => 'Reviews';

  @override
  String get admin_revenue_short => 'Revenue';

  @override
  String get admin_tab_dashboard => 'Dashboard';

  @override
  String get admin_tab_users => 'Users';

  @override
  String get admin_tab_properties => 'Properties';

  @override
  String get admin_tab_reviews => 'Reviews';

  @override
  String get admin_tab_settings => 'Settings';

  @override
  String get approve => 'Approve';

  @override
  String get reject => 'Reject';

  @override
  String get verify => 'Verify';

  @override
  String get unverify => 'Unverify';

  @override
  String get admin_total_messages => 'Total messages';

  @override
  String get feature_ai_chat => 'AI Chat';

  @override
  String get feature_voice_search => 'Voice Search';

  @override
  String get feature_ads => 'Ads';

  @override
  String get feature_reviews => 'Reviews';

  @override
  String get feature_payments => 'Payments';

  @override
  String get language => 'Language';

  @override
  String get language_french => 'French';

  @override
  String get language_english => 'English';

  @override
  String get language_arabic => 'Arabic';

  @override
  String get nav_messages => 'Messages';

  @override
  String get favorite_login_required_title => 'Login required';

  @override
  String get favorite_login_required_message =>
      'You must be logged in to add favorites.';

  @override
  String get dashboard_my_properties => 'My properties';

  @override
  String dashboard_property_count(Object count) {
    return '$count properties';
  }

  @override
  String get tooltip_new_property => 'New property';

  @override
  String get stats_views => 'Views';

  @override
  String get stats_favorites => 'Favorites';

  @override
  String get stats_inquiries => 'Inquiries';

  @override
  String get quick_action_new_ad => 'New listing';

  @override
  String get quick_action_visits => 'Visits';

  @override
  String get quick_action_analytics => 'Analytics';

  @override
  String get quick_action_boost => 'Boost';

  @override
  String delete_confirmation_message(Object title) {
    return 'Delete \"$title\"?';
  }

  @override
  String get tooltip_boost => 'Boost';

  @override
  String get status_available => 'Available';

  @override
  String get status_pending => 'Pending';

  @override
  String get status_reserved => 'Reserved';

  @override
  String get status_rented => 'Rented';

  @override
  String get unit_currency => 'MAD';

  @override
  String get unit_area => 'm²';

  @override
  String get chatbot_title => 'MAROC-LOC AI';

  @override
  String get chatbot_new_conversation => 'New conversation';

  @override
  String get chatbot_language => 'Language';

  @override
  String get chatbot_mic_start => 'Microphone';

  @override
  String get chatbot_mic_stop => 'Stop';

  @override
  String get chatbot_send => 'Send';

  @override
  String get chatbot_error_initial => 'Unable to start the conversation.';

  @override
  String get chat_send => 'Send';

  @override
  String get roleAdmin => 'Admin';

  @override
  String get roleOwner => 'Owner';

  @override
  String get roleTenant => 'Tenant';

  @override
  String get loadMore => 'Scroll to load more';

  @override
  String get messageDeleted => 'Message deleted';

  @override
  String get sendError => 'Send failed';

  @override
  String get search_title => 'Search';

  @override
  String get tooltip_filters => 'Filters';

  @override
  String get filter_advanced_title => 'Advanced filters';

  @override
  String filter_min_price(Object currency) {
    return 'Min price ($currency)';
  }

  @override
  String filter_max_price(Object currency) {
    return 'Max price ($currency)';
  }

  @override
  String get filter_city => 'City';

  @override
  String get filter_all_cities => 'All cities';

  @override
  String get filter_property_type => 'Property type';

  @override
  String get filter_all_types => 'All types';

  @override
  String get filter_transaction => 'Transaction';

  @override
  String get filter_all_transactions => 'All';

  @override
  String get filter_rooms => 'Rooms';

  @override
  String get filter_all_rooms => 'All';

  @override
  String filter_min_surface(Object unit) {
    return 'Min surface ($unit)';
  }

  @override
  String get filter_equipment => 'Equipment';

  @override
  String get filter_environment => 'Environment';

  @override
  String get filter_furnished => 'Furnished';

  @override
  String get filter_parking => 'Parking';

  @override
  String get filter_pool => 'Pool';

  @override
  String get filter_garden => 'Garden';

  @override
  String get filter_ac => 'AC';

  @override
  String get filter_internet => 'Internet';

  @override
  String get filter_security => 'Security';

  @override
  String get filter_balcony => 'Balcony';

  @override
  String get filter_elevator => 'Elevator';

  @override
  String get filter_school => 'School';

  @override
  String get filter_hospital => 'Hospital';

  @override
  String get filter_mosque => 'Mosque';

  @override
  String get filter_bus => 'Bus';

  @override
  String get filter_tram => 'Tram';

  @override
  String get filter_reset => 'Reset';

  @override
  String get filter_apply => 'Apply';

  @override
  String get search_hint => 'Search by city...';

  @override
  String get search_no_results => 'No properties match your search';

  @override
  String get search_reset_filters => 'Reset filters';

  @override
  String get payment_cmi_title => 'CMI Payment';

  @override
  String get payment_cmi_connecting => 'Connecting to CMI...';

  @override
  String get payment_error_invalid_response =>
      'Invalid payment response: missing hash.';

  @override
  String get payment_error_initiation => 'Error initiating payment';

  @override
  String get payment_verifying => 'Verifying payment...';

  @override
  String get payment_success => 'Payment successful';

  @override
  String get payment_failed => 'Payment failed';

  @override
  String payment_order_label(Object orderId) {
    return 'Order: $orderId';
  }

  @override
  String get payment_back_home => 'Back to home';

  @override
  String get boost_title => 'Boost your property';

  @override
  String get boost_type_featured => 'Featured';

  @override
  String get boost_type_top => 'Top listing';

  @override
  String get boost_type_banner => 'Premium banner';

  @override
  String boost_per_week(Object currency, Object price) {
    return '$price $currency/week';
  }

  @override
  String get boost_duration => 'Duration';

  @override
  String get boost_total => 'Total to pay';

  @override
  String get boost_pay_and_boost => 'Pay and boost';

  @override
  String duration_days(Object days) {
    return '$days days';
  }

  @override
  String get empty_notifications_title => 'No notifications';

  @override
  String get empty_notifications_desc => 'You will be notified of updates.';

  @override
  String property_image_of(Object title) {
    return 'Image of $title';
  }

  @override
  String get forgot_password_title => 'Forgot password?';

  @override
  String get forgot_password_desc =>
      'Enter your email address and we will send you a link to reset your password.';

  @override
  String get forgot_password_email_label => 'Email';

  @override
  String get forgot_password_email_hint => 'your@email.com';

  @override
  String get forgot_password_email_required => 'Please enter your email';

  @override
  String get forgot_password_email_invalid => 'Invalid email';

  @override
  String get forgot_password_send => 'Send reset link';

  @override
  String get forgot_password_back_to_login => 'Back to login';

  @override
  String get forgot_password_email_sent => 'Email sent';

  @override
  String get mortgage_title => 'Mortgage calculator';

  @override
  String get mortgage_price => 'Property price';

  @override
  String get mortgage_down_payment => 'Down payment';

  @override
  String get mortgage_rate => 'Annual interest rate (%)';

  @override
  String get mortgage_term => 'Loan term (years)';

  @override
  String get mortgage_calculate => 'Calculate';

  @override
  String get mortgage_results => 'Results';

  @override
  String get mortgage_loan_amount => 'Loan amount';

  @override
  String get mortgage_monthly_payment => 'Monthly payment';

  @override
  String get mortgage_total_interest => 'Total interest';

  @override
  String get mortgage_total_cost => 'Total cost';

  @override
  String get boost_type_label => 'Boost type';

  @override
  String get analytics_properties => 'Properties';

  @override
  String get analytics_views => 'Views';

  @override
  String get analytics_favorites => 'Favorites';

  @override
  String get analytics_inquiries => 'Inquiries';

  @override
  String get analytics_rating => 'Rating';

  @override
  String get analytics_reviews => 'reviews';

  @override
  String get analytics_ad_spend => 'Ad Spend';

  @override
  String get analytics_property_status => 'Property Status';

  @override
  String get analytics_active => 'Active';

  @override
  String get analytics_inactive => 'Inactive';

  @override
  String get analytics_top_properties => 'Top Properties';

  @override
  String get analytics_no_properties_yet => 'No properties yet';

  @override
  String get analytics_unknown => 'Unknown';

  @override
  String get profile_title => 'Profile';

  @override
  String get profile_edit => 'Edit profile';

  @override
  String get profile_dashboard => 'Dashboard';

  @override
  String get profile_admin => 'Administration';

  @override
  String get profile_dark_mode => 'Dark mode';

  @override
  String get profile_tools => 'Tools';

  @override
  String get profile_mortgage_calculator => 'Mortgage calculator';

  @override
  String get profile_logout => 'Logout';

  @override
  String get payment_cmi_secure_title => 'CMI secure payment';

  @override
  String get payment_cancel => 'Cancel payment';

  @override
  String get tooltip_favorite => 'Add to favorites';

  @override
  String get tooltip_unfavorite => 'Remove from favorites';

  @override
  String get tooltip_share => 'Share';

  @override
  String get tooltip_refresh => 'Refresh';

  @override
  String get tooltip_close => 'Close';

  @override
  String get tooltip_clear => 'Clear';

  @override
  String get tooltip_chatbot => 'AI assistant';

  @override
  String get common_required_field => 'Required field';

  @override
  String get common_select => 'Select';

  @override
  String get common_date_format_hint => 'DD/MM/YYYY';

  @override
  String common_error_with_message(Object error) {
    return 'Error: $error';
  }

  @override
  String get language_french_flag => '🇫🇷 French';

  @override
  String get language_english_flag => '🇬🇧 English';

  @override
  String get language_arabic_flag => '🇸🇦 Arabic';

  @override
  String get language_darija_flag => '🇲🇦 Darija';

  @override
  String get advertisement_title => 'Create an ad';

  @override
  String get advertisement_type_label => 'Ad type';

  @override
  String get advertisement_type_hint => 'Select a type';

  @override
  String get advertisement_plan_label => 'Plan';

  @override
  String get advertisement_plan_hint => 'Select a plan';

  @override
  String get advertisement_property_label => 'Property';

  @override
  String get advertisement_property_hint => 'Select a property';

  @override
  String get advertisement_title_label => 'Title';

  @override
  String get advertisement_title_hint => 'Ad title';

  @override
  String get advertisement_description_label => 'Description';

  @override
  String get advertisement_description_hint => 'Detailed description';

  @override
  String get advertisement_budget_label => 'Budget (MAD)';

  @override
  String get advertisement_budget_hint => '100';

  @override
  String get advertisement_budget_required => 'Budget required';

  @override
  String get advertisement_budget_min => 'Minimum 100 MAD';

  @override
  String get advertisement_start_date_label => 'Start date';

  @override
  String get advertisement_end_date_label => 'End date';

  @override
  String get advertisement_select_dates_error =>
      'Please select start and end dates';

  @override
  String get advertisement_end_date_after_start_error =>
      'End date must be after start date';

  @override
  String get advertisement_select_plan_error => 'Please select a plan';

  @override
  String get advertisement_select_property_error => 'Please select a property';

  @override
  String get advertisement_submit => 'Send request';

  @override
  String get advertisement_success => 'Ad request sent successfully';

  @override
  String get property_form_edit_title => 'Edit';

  @override
  String get property_form_create_title => 'New property';

  @override
  String get property_form_step_info => 'Information';

  @override
  String get property_form_step_features => 'Features';

  @override
  String get property_form_step_amenities => 'Amenities';

  @override
  String get property_form_step_environment => 'Environment';

  @override
  String get property_form_step_media => 'Media';

  @override
  String get property_form_previous => 'Previous';

  @override
  String get property_form_next => 'Next';

  @override
  String get property_form_save => 'Save';

  @override
  String get property_form_fill_required =>
      'Please fill in all required fields';

  @override
  String get property_form_title_label => 'Title';

  @override
  String get property_form_description_label => 'Description *';

  @override
  String get property_form_description_required => 'Description required';

  @override
  String get property_form_description_generated =>
      'Description generated successfully';

  @override
  String get property_form_generate_description => 'Generate AI description';

  @override
  String get property_form_price_label => 'Price (MAD) *';

  @override
  String get property_form_price_suggestion => 'AI price suggestion';

  @override
  String get property_form_price_suggestion_title => 'AI price suggestion';

  @override
  String get property_form_apply_price => 'Apply this price';

  @override
  String get property_form_close => 'Close';

  @override
  String property_form_price_range(Object max, Object min) {
    return 'Range: $min - $max';
  }

  @override
  String get property_form_city_label => 'City';

  @override
  String get property_form_address_label => 'Address';

  @override
  String get property_form_type_label => 'Type';

  @override
  String get property_form_category_label => 'Category';

  @override
  String get property_form_surface_label => 'Surface (m²)';

  @override
  String get property_form_rooms_label => 'Rooms';

  @override
  String get property_form_bedrooms_label => 'Bedrooms';

  @override
  String get property_form_bathrooms_label => 'Bathrooms';

  @override
  String get property_form_floor_label => 'Floor';

  @override
  String get property_form_condition_label => 'Condition';

  @override
  String get property_form_furnished => 'Furnished';

  @override
  String get property_form_get_location => 'Get GPS position';

  @override
  String get property_form_add_photos => 'Add photos';

  @override
  String get property_form_add_video => 'Add a video';

  @override
  String get property_form_video_selected => 'Video selected';

  @override
  String get property_form_existing_images => 'Existing images';

  @override
  String get property_form_new_images => 'New images';

  @override
  String get property_form_amenity_parking => 'Parking';

  @override
  String get property_form_amenity_pool => 'Pool';

  @override
  String get property_form_amenity_garden => 'Garden';

  @override
  String get property_form_amenity_ac => 'Air conditioning';

  @override
  String get property_form_amenity_internet => 'WiFi';

  @override
  String get property_form_amenity_security => 'Security';

  @override
  String get property_form_amenity_balcony => 'Balcony';

  @override
  String get property_form_amenity_elevator => 'Elevator';

  @override
  String get property_form_env_cityCenter => 'City center';

  @override
  String get property_form_env_nearSchool => 'School';

  @override
  String get property_form_env_nearUniversity => 'University';

  @override
  String get property_form_env_nearMosque => 'Mosque';

  @override
  String get property_form_env_nearHospital => 'Hospital';

  @override
  String get property_form_env_nearMarket => 'Market';

  @override
  String get property_form_env_nearBus => 'Bus';

  @override
  String get property_form_env_nearTram => 'Tramway';

  @override
  String get property_form_env_nearTrainStation => 'Train station';

  @override
  String get property_form_env_popularArea => 'Popular';

  @override
  String get property_form_env_modernArea => 'Modern';

  @override
  String get property_form_env_quietArea => 'Quiet';

  @override
  String get property_form_env_familyArea => 'Family';

  @override
  String get property_form_env_gardenView => 'Garden view';

  @override
  String get property_form_env_streetView => 'Street view';

  @override
  String get property_form_env_seaView => 'Sea view';

  @override
  String get property_create_success => 'Property created successfully';

  @override
  String get property_update_success => 'Property updated';

  @override
  String get property_detail_schedule_visit => 'Schedule a visit';

  @override
  String property_detail_original_price(Object price) {
    return 'Instead of $price';
  }

  @override
  String get property_detail_reviews_title => 'Reviews';

  @override
  String get property_detail_reviews_error => 'Error loading reviews';

  @override
  String get property_detail_no_reviews => 'No reviews yet. Be the first!';

  @override
  String get property_detail_write_review => 'Write a review';

  @override
  String get property_detail_login_to_review => 'Log in to write a review';

  @override
  String get property_detail_review_hint => 'Your comment...';

  @override
  String get property_detail_review_send => 'Send';

  @override
  String get property_detail_visit_date => 'Date';

  @override
  String get property_detail_visit_time => 'Time';

  @override
  String get property_detail_visit_name => 'Full name';

  @override
  String get property_detail_visit_phone => 'Phone';

  @override
  String get property_detail_visit_notes => 'Notes (optional)';

  @override
  String get property_detail_visit_confirm => 'Confirm';

  @override
  String get property_detail_visit_success => 'Visit scheduled successfully';

  @override
  String get property_detail_login_required_title => 'Login required';

  @override
  String get property_detail_login_required_message =>
      'You must be logged in to perform this action.';

  @override
  String get property_detail_login => 'Log in';

  @override
  String get property_detail_anonymous => 'Anonymous';

  @override
  String get property_detail_owner_default => 'Owner';

  @override
  String get home_for_you => 'For you';

  @override
  String get home_see_more => 'See more';

  @override
  String get home_see_all => 'See all';

  @override
  String get home_top_owners => 'Top owners';

  @override
  String get home_site_reviews => 'Reviews about MAROC-LOC';

  @override
  String get home_leave_review => 'Leave a review';

  @override
  String get home_review_title => 'Give your review';

  @override
  String get home_review_name => 'Your name (optional)';

  @override
  String get home_review_comment => 'Your comment';

  @override
  String get home_review_send => 'Send';

  @override
  String get home_recently_viewed => 'Recently viewed';

  @override
  String get home_top_badge => 'Top';

  @override
  String get home_per_month => ' /month';

  @override
  String get owners_title => 'Owners';

  @override
  String get owners_empty => 'No ranked owners';

  @override
  String get owner_unknown => 'Unknown';

  @override
  String owner_properties_count(Object count) {
    return '$count property';
  }

  @override
  String get owner_reviews => 'Reviews';

  @override
  String get owner_response_rate => 'Response';

  @override
  String get owner_visits => 'Visits';

  @override
  String get owner_view_profile => 'View profile';

  @override
  String get owner_view_properties => 'Properties';

  @override
  String get owner_verified => 'Verified';

  @override
  String get owner_score => 'Score';

  @override
  String get owner_properties_title => 'Owner\'s properties';

  @override
  String get owner_loading_error => 'Loading error';

  @override
  String get owner_not_found => 'Owner not found';

  @override
  String get owner_back => 'Back';

  @override
  String get owner_stats_properties => 'Properties';

  @override
  String get owner_stats_rating => 'Rating';

  @override
  String get owner_stats_premium => 'Premium';

  @override
  String get profile_edit_title => 'Edit profile';

  @override
  String get profile_edit_name => 'Full name';

  @override
  String get profile_edit_email => 'Email';

  @override
  String get profile_edit_phone => 'Phone';

  @override
  String get profile_edit_whatsapp => 'WhatsApp';

  @override
  String get profile_edit_city => 'City';

  @override
  String get profile_edit_preferred_city => 'Preferred city';

  @override
  String get profile_edit_save => 'Save';

  @override
  String get profile_update_success => 'Profile updated';

  @override
  String get register_first_name => 'First name';

  @override
  String get register_last_name => 'Last name';

  @override
  String get register_city_label => 'City';

  @override
  String get register_city_hint => 'Select a city';

  @override
  String get cities_title => 'All cities';

  @override
  String get cities_empty => 'No cities available';

  @override
  String get onboarding_welcome_title => 'Welcome to MAROC-LOC';

  @override
  String get onboarding_welcome_desc =>
      'Find, rent and live in the best real estate properties in Morocco.';

  @override
  String get favorites_login_required => 'Log in again';

  @override
  String get home_recommendations_ai_badge => 'AI';

  @override
  String get advertisement_payment_method_label => 'Payment method';

  @override
  String get advertisement_payment_method_hint => 'Choose a payment method';

  @override
  String get advertisement_payment_method_stripe => 'Stripe / Card';

  @override
  String get advertisement_payment_method_cmi => 'CMI';

  @override
  String get property_whatsapp_default_message =>
      'Hello, I am interested in your property';

  @override
  String property_form_location_coordinates(Object lat, Object lng) {
    return 'Lat: $lat, Lng: $lng';
  }

  @override
  String get my_reservations_title => 'My reservations';

  @override
  String get my_reservations_empty =>
      'You have no reservations or purchases yet.';

  @override
  String get my_reservations_type => 'Type';

  @override
  String get my_reservations_date => 'Date';

  @override
  String get property_untitled => 'Untitled property';
}
