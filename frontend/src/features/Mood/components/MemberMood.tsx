import { useGetUserMoodQuery } from "@/store/userSlice";
import { Moods } from "@/assets";

export const MemberMood = ({ member }: any) => {
    const { data, isFetching } = useGetUserMoodQuery(member.id);

    console.log(Moods.map(mood => mood.name));

    return (
        <div>{member.name}: {data?.mood}</div>
    )

}