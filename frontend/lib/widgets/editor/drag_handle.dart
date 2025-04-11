import 'package:flutter/material.dart';

class DragHandle extends StatelessWidget {
  final bool isFocused;
  
  const DragHandle({
    Key? key,
    required this.isFocused,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 20,
      height: 40,
      margin: const EdgeInsets.only(top: 4),
      child: Center(
        child: Icon(
          Icons.drag_indicator,
          size: 16,
          color: isFocused 
              ? Theme.of(context).colorScheme.primary.withOpacity(0.7)
              : Colors.grey.withOpacity(0.3),
        ),
      ),
    );
  }
}