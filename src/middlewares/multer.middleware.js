import multer from 'multer';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images');
    },

    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const fileFilter = function (req, file, cb) {
    const allowedMimeTypes = [
        // images
        'image/png',
        'image/jpeg',

        // pdf
        'application/pdf',

        // doc/docx
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

        // csv
        'text/csv',

        // zip
        'application/zip',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
        cb(new Error('Unsupported file type'), false);
    } else {
        cb(null, true);
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 1 * 1024 * 1024,
    },
});
