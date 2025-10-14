export type IVerifyEmail = {
     emailOrPhone: string;
     oneTimeCode: number;
};

export type ILoginData = {
     emailOrPhone: string;
     password: string;
};

export type IAuthResetPassword = {
     newPassword: string;
     confirmPassword: string;
};

export type IChangePassword = {
     currentPassword: string;
     newPassword: string;
     confirmPassword: string;
};
