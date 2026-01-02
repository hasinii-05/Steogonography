
import React, { useState, useEffect, useCallback } from 'react';
import { Mode } from './types';
import { encode, decode } from './services/steganographyService';
import Tabs from './components/Tabs';
import ImageUploader from './components/ImageUploader';
import Button from './components/Button';
import { DownloadIcon, KeyIcon, LockIcon, RefreshIcon, UploadIcon } from './components/IconComponents';

const App: React.FC = () => {
    const [mode, setMode] = useState<Mode>(Mode.Encode);
    const [originalImage, setOriginalImage] = useState<{ file: File, url: string } | null>(null);
    const [imageToDecode, setImageToDecode] = useState<{ file: File, url: string } | null>(null);
    const [secretMessage, setSecretMessage] = useState<string>('');
    const [encodedImageUrl, setEncodedImageUrl] = useState<string | null>(null);
    const [decodedMessage, setDecodedMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [notification, setNotification] = useState<string | null>(null);

    useEffect(() => {
        return () => {
            if (originalImage) URL.revokeObjectURL(originalImage.url);
            if (imageToDecode) URL.revokeObjectURL(imageToDecode.url);
            if (encodedImageUrl) URL.revokeObjectURL(encodedImageUrl);
        };
    }, [originalImage, imageToDecode, encodedImageUrl]);

    const handleOriginalImageUpload = (file: File) => {
        if (originalImage) URL.revokeObjectURL(originalImage.url);
        setOriginalImage({ file, url: URL.createObjectURL(file) });
        setEncodedImageUrl(null);
        setError(null);
        setNotification(null);
    };

    const handleImageToDecodeUpload = (file: File) => {
        if (imageToDecode) URL.revokeObjectURL(imageToDecode.url);
        setImageToDecode({ file, url: URL.createObjectURL(file) });
        setDecodedMessage(null);
        setError(null);
        setNotification(null);
    };

    const resetState = () => {
        setOriginalImage(null);
        setImageToDecode(null);
        setSecretMessage('');
        setEncodedImageUrl(null);
        setDecodedMessage(null);
        setIsLoading(false);
        setError(null);
        setNotification(null);
    }
    
    const handleModeChange = (newMode: Mode) => {
        setMode(newMode);
        resetState();
    }

    const processImage = useCallback(<T,>(
        imageFile: File,
        processor: (context: CanvasRenderingContext2D, width: number, height: number) => T
    ): Promise<T> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        return reject(new Error('Failed to get canvas context.'));
                    }
                    ctx.drawImage(img, 0, 0);
                    const result = processor(ctx, img.width, img.height);
                    resolve(result);
                };
                img.onerror = () => reject(new Error('Failed to load image.'));
                img.src = event.target?.result as string;
            };
            reader.onerror = () => reject(new Error('Failed to read file.'));
            reader.readAsDataURL(imageFile);
        });
    }, []);

    const handleEncode = useCallback(async () => {
        if (!originalImage || !secretMessage) {
            setError('Please provide an image and a secret message.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setNotification(null);
        setEncodedImageUrl(null);

        try {
            const canvasUrl = await processImage(originalImage.file, (ctx, width, height) => {
                const imageData = ctx.getImageData(0, 0, width, height);
                const newImageData = encode(imageData, secretMessage);
                if (!newImageData) {
                    throw new Error('Message is too long for the selected image.');
                }
                ctx.putImageData(newImageData, 0, 0);
                return ctx.canvas.toDataURL('image/png');
            });
            setEncodedImageUrl(canvasUrl);
            setNotification('Message encoded successfully!');
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred during encoding.');
        } finally {
            setIsLoading(false);
        }
    }, [originalImage, secretMessage, processImage]);

    const handleDecode = useCallback(async () => {
        if (!imageToDecode) {
            setError('Please provide an image to decode.');
            return;
        }
        
        setIsLoading(true);
        setError(null);
        setNotification(null);
        setDecodedMessage(null);

        try {
            const message = await processImage(imageToDecode.file, (ctx, width, height) => {
                const imageData = ctx.getImageData(0, 0, width, height);
                return decode(imageData);
            });

            if (message) {
                setDecodedMessage(message);
                setNotification('Message decoded successfully!');
            } else {
                setDecodedMessage('');
                setError('No hidden message found in the image.');
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred during decoding.');
        } finally {
            setIsLoading(false);
        }
    }, [imageToDecode, processImage]);

    const renderEncoder = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h2 className="text-xl font-semibold mb-4 text-cyan-400">1. Input</h2>
                <div className="space-y-6">
                    <ImageUploader
                        onImageUpload={handleOriginalImageUpload}
                        title="Upload Original Image (PNG)"
                        uploadedImageUrl={originalImage?.url}
                        icon={<UploadIcon/>}
                    />
                    <textarea
                        value={secretMessage}
                        onChange={(e) => setSecretMessage(e.target.value)}
                        placeholder="Enter your secret message here..."
                        className="w-full h-32 p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                        disabled={isLoading}
                    />
                    <Button onClick={handleEncode} disabled={isLoading || !originalImage || !secretMessage} className="w-full">
                        <LockIcon />
                        {isLoading ? 'Encoding...' : 'Encode Message'}
                    </Button>
                </div>
            </div>
            <div>
                <h2 className="text-xl font-semibold mb-4 text-cyan-400">2. Output</h2>
                <div className="bg-gray-700/50 rounded-lg p-4 min-h-[300px] flex items-center justify-center">
                    {isLoading && <div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div><p className="mt-2">Processing...</p></div>}
                    {!isLoading && encodedImageUrl && (
                        <div className="text-center">
                            <p className="mb-4 font-semibold text-green-400">Encoding Complete!</p>
                            <img src={encodedImageUrl} alt="Encoded" className="max-w-full h-auto max-h-64 rounded-md mx-auto shadow-lg" />
                            <a
                                href={encodedImageUrl}
                                download="encoded-image.png"
                                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-300"
                            >
                                <DownloadIcon/>
                                Download Image
                            </a>
                        </div>
                    )}
                    {!isLoading && !encodedImageUrl && (
                         <div className="text-gray-400 text-center">
                           <p>Your encoded image will appear here.</p>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderDecoder = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h2 className="text-xl font-semibold mb-4 text-teal-400">1. Input</h2>
                <div className="space-y-6">
                    <ImageUploader
                        onImageUpload={handleImageToDecodeUpload}
                        title="Upload Image to Decode (PNG)"
                        uploadedImageUrl={imageToDecode?.url}
                        icon={<UploadIcon/>}
                    />
                    <Button onClick={handleDecode} disabled={isLoading || !imageToDecode} className="w-full">
                        <KeyIcon />
                        {isLoading ? 'Decoding...' : 'Decode Message'}
                    </Button>
                </div>
            </div>
            <div>
                <h2 className="text-xl font-semibold mb-4 text-teal-400">2. Output</h2>
                 <div className="bg-gray-700/50 rounded-lg p-4 min-h-[300px] flex flex-col items-center justify-center">
                     {isLoading && <div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto"></div><p className="mt-2">Processing...</p></div>}
                     {!isLoading && decodedMessage !== null && (
                         <div className="w-full">
                             <p className="font-semibold text-green-400 mb-2">Decoding Complete!</p>
                             <textarea
                                readOnly
                                value={decodedMessage}
                                placeholder="No hidden message was found."
                                className="w-full h-48 p-3 bg-gray-900 border border-gray-600 rounded-md focus:outline-none font-mono text-sm"
                            />
                         </div>
                     )}
                     {!isLoading && decodedMessage === null && (
                         <div className="text-gray-400 text-center">
                             <p>The decoded message will appear here.</p>
                         </div>
                     )}
                 </div>
            </div>
        </div>
    );
    
    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500">
                        Steganography Studio
                    </h1>
                    <p className="mt-2 text-lg text-gray-400">Hide your secrets in plain sight.</p>
                </header>

                <main className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-2xl p-6 sm:p-8 border border-gray-700">
                    <Tabs activeMode={mode} onModeChange={handleModeChange} />
                    
                    <div className="mt-8">
                        {error && <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-md mb-6 text-center">{error}</div>}
                        {notification && <div className="bg-green-500/20 border border-green-500 text-green-300 p-3 rounded-md mb-6 text-center">{notification}</div>}

                        {mode === Mode.Encode ? renderEncoder() : renderDecoder()}
                    </div>
                </main>

                 <footer className="text-center mt-8 text-gray-500 text-sm">
                    <p>Built with React, TypeScript, and Tailwind CSS. All processing is done in your browser.</p>
                 </footer>
            </div>
        </div>
    );
};

export default App;
