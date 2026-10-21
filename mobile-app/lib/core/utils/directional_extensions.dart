import 'package:flutter/material.dart';

extension DirectionalPadding on EdgeInsets {
  EdgeInsetsDirectional toDirectional() {
    return EdgeInsetsDirectional.fromSTEB(left, top, right, bottom);
  }
}
