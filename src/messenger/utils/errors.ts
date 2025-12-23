/**
 * Utility function to extract a readable error message from various error types.
 * Handles: Axios errors, Fetch responses, Error objects, strings, and generic objects.
 */
export function getErrorMessage(err: unknown): string {
  // String errors
  if (typeof err === 'string') {
    return err;
  }
  
  // Error objects with message
  if (err instanceof Error) {
    // Check for Axios-style response errors
    const axiosErr = err as Error & { response?: { data?: { error?: string; message?: string } } };
    if (axiosErr.response?.data?.error) {
      return axiosErr.response.data.error;
    }
    if (axiosErr.response?.data?.message) {
      return axiosErr.response.data.message;
    }
    return err.message;
  }
  
  // Plain objects with error/message properties
  if (typeof err === 'object' && err !== null) {
    const obj = err as Record<string, unknown>;
    
    // Check for nested response (Axios-style)
    if (obj.response && typeof obj.response === 'object') {
      const resp = obj.response as Record<string, unknown>;
      if (resp.data && typeof resp.data === 'object') {
        const data = resp.data as Record<string, unknown>;
        if (typeof data.error === 'string') return data.error;
        if (typeof data.message === 'string') return data.message;
      }
    }
    
    // Direct error/message properties
    if (typeof obj.error === 'string') return obj.error;
    if (typeof obj.message === 'string') return obj.message;
    
    // Try to stringify but limit length
    try {
      const str = JSON.stringify(obj);
      if (str.length > 200) {
        return str.substring(0, 200) + '...';
      }
      return str;
    } catch {
      return 'Erreur inconnue';
    }
  }
  
  return 'Erreur inconnue';
}
