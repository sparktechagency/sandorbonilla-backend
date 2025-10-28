const getCurrentMonthYear = () => {
    const currentDate = new Date();
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return {
        currentMonth: months[currentDate.getMonth()],
        currentYear: currentDate.getFullYear(),
        months,
    };
};
export default getCurrentMonthYear;
