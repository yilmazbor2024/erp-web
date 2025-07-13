/**
 * Kullanıcı bilgilerini temsil eden tip tanımı
 */
export interface User {
  id: string;
  userName: string;
  email: string;
  roles: string | string[];
}

/**
 * Kimlik doğrulama yanıtını temsil eden tip tanımı
 */
export interface AuthResponse {
  token: string;
  user: User;
}
