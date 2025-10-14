function verifyEmailOrPhone(emailOrPhone: string) {
    const isEmailBool = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOrPhone);
    return {
        query: isEmailBool
            ? { email: emailOrPhone }
            : { phone: emailOrPhone },
        isEmail: isEmailBool,
        email: isEmailBool ? emailOrPhone : undefined,
        phone: isEmailBool ? undefined : emailOrPhone,
    };
}

export default verifyEmailOrPhone;
