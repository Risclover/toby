import { useGetUserMoodQuery } from "@/store/userSlice";


export const MemberMood = ({ member }: any) => {
    const { data, isFetching } = useGetUserMoodQuery(member.id);

    return (
        <div>{member.name}: {data?.mood}</div>
    )

}