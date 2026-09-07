export class HttpError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const unauthorized = (message = "로그인이 필요합니다.") => new HttpError(401, message);

export const forbidden = (message = "권한이 없습니다.") => new HttpError(403, message);

export const notFound = (message = "대상을 찾을 수 없습니다.") => new HttpError(404, message);

export const badRequest = (message, details = undefined) => new HttpError(400, message, details);
