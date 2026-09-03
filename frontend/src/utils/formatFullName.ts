export const formatFullName = (user: { firstName: string; lastName: string }) => {
    return `${user.firstName} ${user.lastName}`;
}