export { auth as middleware } from "@/auth"

export const config = {
    matcher: [
        "/api/profile",
        "/api/missions",
        "/api/missions/complete",
        "/api/comps/saved",
    ],
}
