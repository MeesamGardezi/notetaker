import 'dart:convert';
import 'package:dio/dio.dart';
import '../services/storage_service.dart';
import '../utils/constants.dart';

class ApiService {
  final StorageService storageService;
  late final Dio _dio;
  
  ApiService({required this.storageService}) {
    _initializeDio();
  }
  
  void _initializeDio() {
    _dio = Dio(BaseOptions(
      baseUrl: API_BASE_URL,
      connectTimeout: const Duration(milliseconds: 5000),
      receiveTimeout: const Duration(milliseconds: 3000),
      contentType: 'application/json',
      responseType: ResponseType.json,
    ));
    
    // Add interceptor for authentication
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Add auth token to request if available
        final token = await storageService.getAuthToken();
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException error, handler) async {
        // Handle authentication errors
        if (error.response?.statusCode == 401) {
          // Token expired, attempt to refresh
          final refreshed = await _refreshToken();
          if (refreshed) {
            // Retry the original request
            return handler.resolve(await _retry(error.requestOptions));
          }
        }
        return handler.next(error);
      },
    ));
  }
  
  // Retry a failed request with updated token
  Future<Response<dynamic>> _retry(RequestOptions requestOptions) async {
    final options = Options(
      method: requestOptions.method,
      headers: requestOptions.headers,
    );
    
    return _dio.request<dynamic>(
      requestOptions.path,
      data: requestOptions.data,
      queryParameters: requestOptions.queryParameters,
      options: options,
    );
  }
  
  // Attempt to refresh the token
  Future<bool> _refreshToken() async {
    try {
      final token = await storageService.getAuthToken();
      if (token == null) return false;
      
      // Create a separate Dio instance without the auth interceptor to avoid loops
      final tokenDio = Dio(BaseOptions(
        baseUrl: API_BASE_URL,
        headers: {'Authorization': 'Bearer $token'},
      ));
      
      final response = await tokenDio.post<Map<String, dynamic>>(
        '/api/auth/refresh-token',
      );
      
      if (response.statusCode == 200 && response.data != null) {
        final newToken = response.data!['token'] as String;
        await storageService.setAuthToken(newToken);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
  
  // Authentication APIs
  
  Future<Map<String, dynamic>> register(String email, String password, String displayName) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/auth/register',
      data: {
        'email': email,
        'password': password,
        'displayName': displayName,
      },
    );
    return response.data!;
  }
  
  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/auth/login',
      data: {
        'email': email,
        'password': password,
      },
    );
    return response.data!;
  }
  
  Future<void> logout() async {
    await _dio.post('/api/auth/logout');
  }
  
  Future<Map<String, dynamic>> refreshToken() async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/auth/refresh-token',
    );
    return response.data!;
  }
  
  // User Profile APIs
  
  Future<Map<String, dynamic>> getUserProfile() async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/api/users/profile',
    );
    return response.data!;
  }
  
  Future<Map<String, dynamic>> updateUserProfile(Map<String, dynamic> data) async {
    final response = await _dio.patch<Map<String, dynamic>>(
      '/api/users/profile',
      data: data,
    );
    return response.data!;
  }
  
  Future<void> changePassword(String currentPassword, String newPassword) async {
    await _dio.post(
      '/api/users/change-password',
      data: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      },
    );
  }
  
  // Module APIs
  
  Future<List<dynamic>> getModules({bool includeArchived = false}) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/api/modules',
      queryParameters: {
        'includeArchived': includeArchived.toString(),
      },
    );
    return response.data!['modules'];
  }
  
  Future<Map<String, dynamic>> createModule(String title, {String? description, String? color, String? icon}) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/modules',
      data: {
        'title': title,
        'description': description,
        'color': color,
        'icon': icon,
      },
    );
    return response.data!;
  }
  
  Future<Map<String, dynamic>> getModule(String moduleId) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/api/modules/$moduleId',
    );
    return response.data!['module'];
  }
  
  Future<Map<String, dynamic>> updateModule(String moduleId, {
    String? title,
    String? description,
    String? color,
    String? icon,
    int? sortOrder,
    bool? isArchived,
  }) async {
    final data = <String, dynamic>{};
    if (title != null) data['title'] = title;
    if (description != null) data['description'] = description;
    if (color != null) data['color'] = color;
    if (icon != null) data['icon'] = icon;
    if (sortOrder != null) data['sortOrder'] = sortOrder;
    if (isArchived != null) data['isArchived'] = isArchived;
    
    final response = await _dio.patch<Map<String, dynamic>>(
      '/api/modules/$moduleId',
      data: data,
    );
    return response.data!;
  }
  
  Future<void> deleteModule(String moduleId) async {
    await _dio.delete('/api/modules/$moduleId');
  }
  
  Future<void> reorderModules(List<String> moduleIds) async {
    await _dio.post(
      '/api/modules/reorder',
      data: {
        'moduleIds': moduleIds,
      },
    );
  }
  
  // Note APIs
  
  Future<List<dynamic>> getModuleNotes(String moduleId, {bool includeArchived = false}) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/api/notes/module/$moduleId',
      queryParameters: {
        'includeArchived': includeArchived.toString(),
      },
    );
    return response.data!['notes'];
  }
  
  Future<List<dynamic>> getStarredNotes({bool includeArchived = false}) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/api/notes/starred',
      queryParameters: {
        'includeArchived': includeArchived.toString(),
      },
    );
    return response.data!['notes'];
  }
  
  Future<List<dynamic>> getRecentNotes({int limit = 10}) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/api/notes/recent',
      queryParameters: {
        'limit': limit.toString(),
      },
    );
    return response.data!['notes'];
  }
  
  Future<List<dynamic>> searchNotes(String query, {String? moduleId}) async {
    final queryParams = <String, dynamic>{
      'query': query,
    };
    if (moduleId != null) {
      queryParams['moduleId'] = moduleId;
    }
    
    final response = await _dio.get<Map<String, dynamic>>(
      '/api/notes/search',
      queryParameters: queryParams,
    );
    return response.data!['notes'];
  }
  
  Future<Map<String, dynamic>> createNote(String moduleId, String title, {
    Map<String, dynamic>? content,
    List<String>? tags,
    bool isStarred = false,
  }) async {
    final data = <String, dynamic>{
      'moduleId': moduleId,
      'title': title,
      'isStarred': isStarred,
    };
    if (content != null) data['content'] = content;
    if (tags != null) data['tags'] = tags;
    
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/notes',
      data: data,
    );
    return response.data!;
  }
  
  Future<Map<String, dynamic>> getNote(String noteId) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/api/notes/$noteId',
    );
    return response.data!['note'];
  }
  
  Future<Map<String, dynamic>> updateNote(String noteId, {
    String? title,
    Map<String, dynamic>? content,
    List<String>? tags,
    bool? isStarred,
    bool? isArchived,
    String? moduleId,
    int? sortOrder,
  }) async {
    final data = <String, dynamic>{};
    if (title != null) data['title'] = title;
    if (content != null) data['content'] = content;
    if (tags != null) data['tags'] = tags;
    if (isStarred != null) data['isStarred'] = isStarred;
    if (isArchived != null) data['isArchived'] = isArchived;
    if (moduleId != null) data['moduleId'] = moduleId;
    if (sortOrder != null) data['sortOrder'] = sortOrder;
    
    final response = await _dio.patch<Map<String, dynamic>>(
      '/api/notes/$noteId',
      data: data,
    );
    return response.data!;
  }
  
  Future<void> deleteNote(String noteId) async {
    await _dio.delete('/api/notes/$noteId');
  }
  
  // Tag APIs
  
  Future<List<dynamic>> getTags() async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/api/tags',
    );
    return response.data!['tags'];
  }
  
  Future<Map<String, dynamic>> createTag(String name, {String? color}) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/tags',
      data: {
        'name': name,
        'color': color,
      },
    );
    return response.data!;
  }
  
  Future<Map<String, dynamic>> updateTag(String tagId, {String? name, String? color}) async {
    final data = <String, dynamic>{};
    if (name != null) data['name'] = name;
    if (color != null) data['color'] = color;
    
    final response = await _dio.patch<Map<String, dynamic>>(
      '/api/tags/$tagId',
      data: data,
    );
    return response.data!;
  }
  
  Future<void> deleteTag(String tagId) async {
    await _dio.delete('/api/tags/$tagId');
  }
  
  Future<Map<String, dynamic>> getNotesByTag(String tagId, {bool includeArchived = false}) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/api/tags/$tagId/notes',
      queryParameters: {
        'includeArchived': includeArchived.toString(),
      },
    );
    return response.data!;
  }
  
  // Image APIs
  
  Future<Map<String, dynamic>> uploadImage(String noteId, dynamic imageFile) async {
    // Create form data
    final formData = FormData.fromMap({
      'image': await MultipartFile.fromFile(
        imageFile.path,
        filename: imageFile.path.split('/').last,
      ),
    });
    
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/images/note/$noteId',
      data: formData,
      options: Options(
        contentType: 'multipart/form-data',
      ),
    );
    return response.data!;
  }
  
  Future<List<dynamic>> getNoteImages(String noteId) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/api/images/note/$noteId',
    );
    return response.data!['images'];
  }
  
  Future<void> deleteImage(String imageId) async {
    await _dio.delete('/api/images/$imageId');
  }
  
  Future<Map<String, dynamic>> getUserImages({int page = 1, int limit = 20}) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/api/images',
      queryParameters: {
        'page': page.toString(),
        'limit': limit.toString(),
      },
    );
    return response.data!;
  }
}