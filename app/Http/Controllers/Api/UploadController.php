<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UploadController extends Controller
{
    // public/.user.ini asks the server for a higher upload_max_filesize, but
    // on this host that override is being silently ignored (confirmed - the
    // live ini value never changed), so the real ceiling is still whatever
    // the account's PHP config says (2MB at last check). Kept just under
    // that so this check's clearer message fires instead of a raw PHP-level
    // truncation. Raise both this and .user.ini together if the hosting
    // account's upload_max_filesize is ever increased (cPanel > MultiPHP INI
    // Editor - not something reachable via the file-level API this app's
    // deploys use).
    private const MAX_SIZE_BYTES = 1.8 * 1024 * 1024; // 1.8MB

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

        // A file that exceeds the server's own upload_max_filesize/post_max_size
        // never fully arrives - PHP rejects it before Laravel sees real content,
        // and $file->getSize() at that point reflects the truncated upload, not
        // the original. Catching this via getError() first avoids misreporting
        // a too-large photo as "unsupported file type" once it fails the
        // getimagesize() check below for an unrelated reason.
        if (! $file->isValid()) {
            $tooLarge = in_array($file->getError(), [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true);

            return response()->json([
                'error' => $tooLarge
                    ? 'That photo is too large for this server to accept right now. Try a smaller photo, or screenshot it (screenshots are usually much smaller than full camera photos).'
                    : 'Upload failed. Please try a different photo.',
            ], 400);
        }

        if ($file->getSize() > self::MAX_SIZE_BYTES) {
            return response()->json(['error' => 'File is too large. Max size is '.(self::MAX_SIZE_BYTES / 1024 / 1024).'MB.'], 400);
        }

        // getimagesize() reads the real image header bytes directly — unlike
        // getMimeType(), it doesn't depend on the fileinfo PHP extension,
        // which this host doesn't have enabled (and can't enable without
        // WHM/root access). It's also stronger validation: a renamed .php
        // file with a .jpg extension won't pass this check either way.
        $imageInfo = @getimagesize($file->getRealPath());
        if ($imageInfo === false || ! in_array($imageInfo['mime'], self::ALLOWED_MIMES, true)) {
            return response()->json([
                'error' => "That file isn't a supported image (JPG, PNG, WEBP or GIF). If you took this photo on an iPhone, it's probably saved as HEIC — open it in Photos, tap Share, then \"Save as JPEG\" (or just take a screenshot of it) and upload that instead.",
            ], 400);
        }

        $ext = self::EXT_BY_MIME[$imageInfo['mime']];
        $filename = now()->getTimestampMs().'-'.substr(bin2hex(random_bytes(4)), 0, 6).'.'.$ext;

        $file->move(public_path("uploads/{$scope}"), $filename);

        return response()->json(['url' => "/uploads/{$scope}/{$filename}"], 201);
    }
}
