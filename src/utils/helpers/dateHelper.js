const formatVietnameseDateTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'Asia/Ho_Chi_Minh'
    });
};
const isValidDate = (dateString) => {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
};

module.exports = { formatVietnameseDateTime, isValidDate };