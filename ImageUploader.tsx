
import React, { useRef } from 'react';

interface ImageUploaderProps {
    onImageUpload: (file: File) => void;
    title: string;
    uploadedImageUrl?: string | null;
    icon: React.ReactNode;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, title, uploadedImageUrl, icon }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === 'image/png') {
            onImageUpload(file);
        } else {
            // Basic error handling, could be improved with a callback to parent
            alert('Please upload a valid PNG file.');
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const file = event.dataTransfer.files?.[0];
        if (file && file.type === 'image/png') {
            onImageUpload(file);
        } else {
            alert('Please upload a valid PNG file.');
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div
            className="w-full h-64 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-center p-4 cursor-pointer hover:border-cyan-500 hover:bg-gray-700/50 transition-all duration-300 relative"
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png"
                className="hidden"
            />
            {uploadedImageUrl ? (
                <img src={uploadedImageUrl} alt="Uploaded preview" className="max-h-full max-w-full object-contain rounded-md" />
            ) : (
                <div className="text-gray-400">
                    <div className="w-12 h-12 mx-auto mb-2 text-gray-500">{icon}</div>
                    <p className="font-semibold">{title}</p>
                    <p className="text-sm">Drag & drop or click to upload</p>
                </div>
            )}
        </div>
    );
};

export default ImageUploader;
