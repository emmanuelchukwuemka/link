<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UploadController extends Controller
{
    private const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

    private const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    private const EXT_BY_MIME = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
    ];

    /**
     * Local-disk upload for a single-server deployment. Files land in
     * public/uploads/<userId>/ and are served directly as static files — no
     * object storage configured yet. Auth is optional: card-customization
     * uploads happen during guest checkout, so unauthenticated uploads are
     * scoped to public/uploads/guest/ instead.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $scope = $request->user()?->id ?? 'guest';

        $file = $request->file('file');
        if (! $file) {
            return response()->json(['error' => 'No file provided'], 400);
        }
        if (! in_array($file->getMimeType(), self::ALLOWED_MIMES, true)) {
            return response()->json(['error' => 'Unsupported file type. Use JPG, PNG, WEBP or GIF.'], 400);
        }
        if ($file->getSize() > self::MAX_SIZE_BYTES) {
            return response()->json(['error' => 'File is too large. Max size is 5MB.'], 400);
        }

        $ext = self::EXT_BY_MIME[$file->getMimeType()];
        $filename = now()->getTimestampMs().'-'.substr(bin2hex(random_bytes(4)), 0, 6).'.'.$ext;

        $file->move(public_path("uploads/{$scope}"), $filename);

        return response()->json(['url' => "/uploads/{$scope}/{$filename}"], 201);
    }
}
