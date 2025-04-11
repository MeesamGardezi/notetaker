import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:image_cropper/image_cropper.dart';
import 'package:path_provider/path_provider.dart';
import 'package:http/http.dart' as http;
import 'package:path/path.dart' as path;
import '../models/image_model.dart';
import '../services/api_service.dart';

class ImageService {
  final ApiService apiService;
  final ImagePicker _imagePicker = ImagePicker();
  
  ImageService({required this.apiService});
  
  // Pick image from gallery or camera
  Future<File?> pickImage({
    required ImageSource source,
    int maxWidth = 1920,
    int maxHeight = 1920,
    int imageQuality = 85,
  }) async {
    try {
      final pickedFile = await _imagePicker.pickImage(
        source: source,
        maxWidth: maxWidth.toDouble(),
        maxHeight: maxHeight.toDouble(),
        imageQuality: imageQuality,
      );
      
      if (pickedFile != null) {
        return File(pickedFile.path);
      }
      
      return null;
    } catch (e) {
      print('Error picking image: $e');
      return null;
    }
  }
  
  // Crop image
  Future<File?> cropImage(
    File imageFile, {
    double? aspectRatio,
    CropStyle cropStyle = CropStyle.rectangle,
  }) async {
    try {
      final croppedFile = await ImageCropper().cropImage(
        sourcePath: imageFile.path,
        aspectRatio: aspectRatio != null 
            ? CropAspectRatio(ratioX: aspectRatio, ratioY: 1)
            : null,
        cropStyle: cropStyle,
        compressQuality: 85,
        compressFormat: ImageCompressFormat.jpg,
        uiSettings: [
          AndroidUiSettings(
            toolbarTitle: 'Crop Image',
            toolbarColor: Colors.deepPurple,
            toolbarWidgetColor: Colors.white,
            initAspectRatio: CropAspectRatioPreset.original,
            lockAspectRatio: aspectRatio != null,
          ),
          IOSUiSettings(
            title: 'Crop Image',
            minimumAspectRatio: 1.0,
            aspectRatioLockEnabled: aspectRatio != null,
          ),
        ],
      );
      
      if (croppedFile != null) {
        return File(croppedFile.path);
      }
      
      return null;
    } catch (e) {
      print('Error cropping image: $e');
      return null;
    }
  }
  
  // Upload image to server
  Future<ImageModel?> uploadImage(
    String noteId,
    File imageFile,
  ) async {
    try {
      final response = await apiService.uploadImage(noteId, imageFile);
      
      if (response != null && response.containsKey('image')) {
        return ImageModel.fromJson(response['image']);
      }
      
      return null;
    } catch (e) {
      print('Error uploading image: $e');
      return null;
    }
  }
  
  // Get all images for a note
  Future<List<ImageModel>> getNoteImages(String noteId) async {
    try {
      final imagesData = await apiService.getNoteImages(noteId);
      
      return imagesData
          .map((json) => ImageModel.fromJson(json))
          .toList();
    } catch (e) {
      print('Error getting note images: $e');
      return [];
    }
  }
  
  // Delete an image
  Future<bool> deleteImage(String imageId) async {
    try {
      await apiService.deleteImage(imageId);
      return true;
    } catch (e) {
      print('Error deleting image: $e');
      return false;
    }
  }
  
  // Get user images with pagination
  Future<Map<String, dynamic>> getUserImages({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await apiService.getUserImages(
        page: page,
        limit: limit,
      );
      
      final images = (response['images'] as List)
          .map((json) => ImageModel.fromJson(json))
          .toList();
      
      return {
        'images': images,
        'pagination': response['pagination'],
      };
    } catch (e) {
      print('Error getting user images: $e');
      return {
        'images': <ImageModel>[],
        'pagination': {
          'total': 0,
          'page': page,
          'pageSize': limit,
          'totalPages': 0,
        },
      };
    }
  }
  
  // Download image to local storage
  Future<File?> downloadImage(String imageUrl, {String? filename}) async {
    try {
      // Create a unique filename if not provided
      final fileName = filename ?? path.basename(imageUrl);
      
      // Get temporary directory
      final dir = await getTemporaryDirectory();
      final filePath = path.join(dir.path, fileName);
      
      // Download image
      final response = await http.get(Uri.parse(imageUrl));
      
      if (response.statusCode == 200) {
        // Save to file
        final file = File(filePath);
        await file.writeAsBytes(response.bodyBytes);
        return file;
      }
      
      return null;
    } catch (e) {
      print('Error downloading image: $e');
      return null;
    }
  }
  
  // Get image dimensions
  Future<Map<String, int>?> getImageDimensions(File imageFile) async {
    try {
      final image = await decodeImageFromList(await imageFile.readAsBytes());
      
      return {
        'width': image.width,
        'height': image.height,
      };
    } catch (e) {
      print('Error getting image dimensions: $e');
      return null;
    }
  }
  
  // Check if an image exceeds size limits
  bool isImageSizeExceeded(File imageFile, int maxSizeBytes) {
    return imageFile.lengthSync() > maxSizeBytes;
  }
  
  // Clear temporary image cache
  Future<void> clearTemporaryCache() async {
    try {
      final dir = await getTemporaryDirectory();
      if (dir.existsSync()) {
        dir.listSync()
          .whereType<File>()
          .where((file) => 
            ['.jpg', '.jpeg', '.png', '.gif', '.webp']
              .contains(path.extension(file.path).toLowerCase())
          )
          .forEach((file) {
            try {
              file.deleteSync();
            } catch (_) {}
          });
      }
    } catch (e) {
      print('Error clearing image cache: $e');
    }
  }
}