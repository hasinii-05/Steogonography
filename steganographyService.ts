
const DELIMITER = '$$STEGEND$$';

const messageToBinary = (message: string): string => {
    return message.split('').map(char => {
        return char.charCodeAt(0).toString(2).padStart(8, '0');
    }).join('');
};

const binaryToMessage = (binaryStr: string): string => {
    let message = '';
    for (let i = 0; i < binaryStr.length; i += 8) {
        const byte = binaryStr.slice(i, i + 8);
        if (byte.length === 8) {
            message += String.fromCharCode(parseInt(byte, 2));
        }
    }
    return message;
};

export const encode = (imageData: ImageData, message: string): ImageData | null => {
    const binaryMessage = messageToBinary(message + DELIMITER);
    const data = new Uint8ClampedArray(imageData.data);

    // Each pixel has 3 channels (R,G,B) we can use. Alpha is ignored.
    const maxBits = data.length / 4 * 3;
    if (binaryMessage.length > maxBits) {
        return null; // Message too long
    }

    let bitIndex = 0;
    for (let i = 0; i < data.length && bitIndex < binaryMessage.length; i += 4) {
        // Red channel
        if (bitIndex < binaryMessage.length) {
            const bit = parseInt(binaryMessage[bitIndex++], 10);
            data[i] = (data[i] & 0xFE) | bit; // Set LSB
        }
        // Green channel
        if (bitIndex < binaryMessage.length) {
            const bit = parseInt(binaryMessage[bitIndex++], 10);
            data[i + 1] = (data[i + 1] & 0xFE) | bit; // Set LSB
        }
        // Blue channel
        if (bitIndex < binaryMessage.length) {
            const bit = parseInt(binaryMessage[bitIndex++], 10);
            data[i + 2] = (data[i + 2] & 0xFE) | bit; // Set LSB
        }
    }

    return new ImageData(data, imageData.width, imageData.height);
};

export const decode = (imageData: ImageData): string | null => {
    const data = imageData.data;
    let binaryMessage = '';
    let foundMessage = '';

    for (let i = 0; i < data.length; i += 4) {
        // Red channel
        binaryMessage += (data[i] & 1).toString();
        // Green channel
        binaryMessage += (data[i + 1] & 1).toString();
        // Blue channel
        binaryMessage += (data[i + 2] & 1).toString();

        // Check for delimiter every 8 bits to improve performance
        if (binaryMessage.length % 8 === 0) {
            foundMessage = binaryToMessage(binaryMessage);
            const delimiterIndex = foundMessage.indexOf(DELIMITER);
            if (delimiterIndex !== -1) {
                return foundMessage.substring(0, delimiterIndex);
            }
        }
    }
    
    // Final check in case the delimiter is not byte-aligned.
    foundMessage = binaryToMessage(binaryMessage);
    const delimiterIndex = foundMessage.indexOf(DELIMITER);
    if (delimiterIndex !== -1) {
        return foundMessage.substring(0, delimiterIndex);
    }

    return null; // Delimiter not found
};
