// src/utils/catchAsync.js
export const catchAsync = (fn) => {
    return (req, res, next) => {
        // Егер функцияда қате шықса, оны автоматты түрде next(error)-ға береді
        fn(req, res, next).catch(next);
    };
};