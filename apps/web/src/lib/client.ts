export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function fetcher<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(body?.error ?? `Request failed (${res.status})`, res.status);
  }
  return body as T;
}

export function apiGet<T>(url: string): Promise<T> {
  return fetcher<T>(url);
}

export function apiPost<T>(url: string, data?: unknown): Promise<T> {
  return fetcher<T>(url, {
    method: 'POST',
    body: data === undefined ? undefined : JSON.stringify(data),
  });
}

export function apiPatch<T>(url: string, data?: unknown): Promise<T> {
  return fetcher<T>(url, {
    method: 'PATCH',
    body: data === undefined ? undefined : JSON.stringify(data),
  });
}

export function apiDelete<T>(url: string): Promise<T> {
  return fetcher<T>(url, { method: 'DELETE' });
}

/** Upload a file with progress reporting (used by web + desktop). */
export function uploadWithProgress(
  url: string,
  file: File | Blob,
  onProgress?: (percent: number) => void,
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.responseType = 'json';
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response);
      else
        reject(
          new ApiError(
            (xhr.response as { error?: string })?.error ?? `Upload failed (${xhr.status})`,
            xhr.status,
          ),
        );
    };
    xhr.onerror = () => reject(new ApiError('Network error during upload', 0));
    xhr.send(file);
  });
}
