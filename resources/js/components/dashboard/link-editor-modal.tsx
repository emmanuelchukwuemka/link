import { useState, useEffect } from 'react';
import { X, Trash2, ChevronDown } from 'lucide-react';
import { ImageUploader } from '@/components/image-uploader';
import { LINK_ICON_NAMES, getLinkIcon } from '@/lib/profile/linkIcons';
import { apiFetch } from '@/lib/api';

export type LinkType = {
    id: number;
    title: string;
    url: string;
    thumbnail?: string | null;
    is_active: boolean;
    icon_name?: string | null;
    description?: string | null;
};

export function LinkEditorModal({ existing, onClose, onSaved }: { existing?: LinkType | null; onClose: () => void; onSaved: (link: LinkType) => void }) {
    const [title, setTitle] = useState(existing?.title || '');
    const [url, setUrl] = useState(existing?.url || '');
    const [description, setDescription] = useState(existing?.description || '');
    const [thumbnail, setThumbnail] = useState(existing?.thumbnail || '');
    const [iconName, setIconName] = useState(existing?.icon_name || 'link');
    const [iconPickerOpen, setIconPickerOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const Icon = getLinkIcon(iconName);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const handleSave = async () => {
        if (!url.trim()) {
            setError('Add a link URL.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const { ok, data } = await apiFetch(
                existing ? `/api/links/${existing.id}` : '/api/links',
                { title: title || url, url, description, thumbnail: thumbnail || null, iconName: iconName },
                existing ? 'PUT' : 'POST',
            );
            if (!ok) throw new Error((data.error as string) || 'Could not save link');
            onSaved(data.link as LinkType);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not save link');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold">{existing ? 'Edit link' : 'Add link'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-black p-1">
                        <X size={20} />
                    </button>
                </div>

                {/* Thumbnail */}
                <div className="flex items-center gap-4 mb-5">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                        {thumbnail ? <img src={thumbnail} alt="" className="w-full h-full object-cover" /> : <Icon size={24} className="text-gray-400" />}
                    </div>
                    <div className="flex-1 space-y-2">
                        <ImageUploader
                            onUploaded={(url) => setThumbnail(url)}
                            label={thumbnail ? 'Change thumbnail' : 'Add thumbnail'}
                            className="bg-gray-100 text-black px-3 py-2 rounded-full font-semibold text-xs hover:bg-gray-200 flex items-center gap-1.5"
                        />
                        {thumbnail && (
                            <button type="button" onClick={() => setThumbnail('')} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
                                <Trash2 size={12} /> Remove thumbnail
                            </button>
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-semibold mb-1.5">Link URL</label>
                        <input
                            type="url"
                            autoFocus
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:bg-white focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1.5">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="What should this button say?"
                            className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:bg-white focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1.5">
                            Description <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="A short note under the title"
                            className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:bg-white focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
                        />
                    </div>

                    {!thumbnail && (
                        <div className="relative">
                            <label className="block text-sm font-semibold mb-1.5">Icon</label>
                            <button
                                type="button"
                                onClick={() => setIconPickerOpen((o) => !o)}
                                className="flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-2 transition-colors"
                            >
                                <Icon size={16} className="text-gray-500" />
                                <span className="capitalize">{iconName}</span>
                                <ChevronDown size={14} className="text-gray-400" />
                            </button>
                            {iconPickerOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIconPickerOpen(false)} />
                                    <div className="absolute top-full left-0 mt-2 z-20 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 grid grid-cols-4 gap-2 w-56">
                                        {LINK_ICON_NAMES.map((name) => {
                                            const OptionIcon = getLinkIcon(name);
                                            const selected = iconName === name;
                                            return (
                                                <button
                                                    key={name}
                                                    type="button"
                                                    onClick={() => {
                                                        setIconName(name);
                                                        setIconPickerOpen(false);
                                                    }}
                                                    title={name}
                                                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${selected ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                                                >
                                                    <OptionIcon size={18} />
                                                    <span className="text-[10px] capitalize truncate w-full text-center">{name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-black text-white rounded-full py-3.5 font-semibold mt-6 hover:bg-gray-800 transition-colors disabled:opacity-60"
                >
                    {saving ? 'Saving...' : 'Save'}
                </button>
            </div>
        </div>
    );
}
