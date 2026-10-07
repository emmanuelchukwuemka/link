import { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';

function xsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

export function ImageUploader({
    onUploaded,
    className = 'bg-black text-white px-4 py-2 rounded-full font-semibold text-sm hover:bg-gray-800 flex items-center gap-2',
    label = 'Upload image',
}: {
    onUploaded: (url: string) => void;
    className?: string;
    label?: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError('');
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/upload', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'X-XSRF-TOKEN': xsrfToken() },
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');
            onUploaded(data.url);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    return (
        <div>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleChange} className="hidden" />
            <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className={`${className} disabled:opacity-60`}>
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {uploading ? 'Uploading...' : label}
            </button>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}
