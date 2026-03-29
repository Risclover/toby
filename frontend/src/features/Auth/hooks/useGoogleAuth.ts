import { useState, useEffect } from "react";
import { useGoogleLogin, type TokenResponse } from "@react-oauth/google";
import { useGoogleLoginMutation, useJoinExistingHouseholdMutation } from "@/store";
import { useNavigate } from "react-router-dom";

export const useGoogleAuth = (inviteCode?: string) => {
    const [googleToken, setGoogleToken] = useState<TokenResponse | null>(null);
    const [googleLogin] = useGoogleLoginMutation();
    const [joinExistingHousehold] = useJoinExistingHouseholdMutation();
    const navigate = useNavigate();

    const signin = useGoogleLogin({
        onSuccess: (tokenResponse) => setGoogleToken(tokenResponse),
        onError: (error) => console.log('login failed:', error)
    });

    useEffect(() => {
        if (!googleToken?.access_token) return;

        googleLogin({ access_token: googleToken.access_token, invite_code: inviteCode })
            .unwrap()
            .then((tobyUser) => {
                navigate(tobyUser.householdId ? '/' : '/onboarding');
            })
            .catch(console.error);
    }, [googleToken]);

    return { signin };
};