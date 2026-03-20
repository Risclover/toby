// hooks/useGoogleAuth.ts
import { useState, useEffect } from "react";
import { useGoogleLogin, type TokenResponse } from "@react-oauth/google";
import { useGoogleLoginMutation } from "@/store";
import { useNavigate } from "react-router-dom";

export const useGoogleAuth = () => {
    const [googleToken, setGoogleToken] = useState<TokenResponse | null>(null);
    const [googleLogin] = useGoogleLoginMutation();
    const navigate = useNavigate();

    const signin = useGoogleLogin({
        onSuccess: (tokenResponse) => setGoogleToken(tokenResponse),
        onError: (error) => console.log('login failed:', error)
    });

    useEffect(() => {
        if (googleToken?.access_token) {
            googleLogin({ access_token: googleToken.access_token })
                .unwrap()
                .then(tobyUser => {
                    navigate(tobyUser.householdId ? '/' : '/onboarding');
                })
                .catch(console.error)
        }
    }, [googleToken]);

    return { signin };
};