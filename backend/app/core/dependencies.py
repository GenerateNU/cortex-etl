from fastapi import HTTPException, Request

from app.core.supabase import supabase


async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = auth_header.split(" ")[1]

    try:
        user_response = supabase.auth.get_user(token)
        user = user_response.user

        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")

        profile_result = (
            supabase.table("profiles")
            .select("role, tenant_id")
            .eq("id", user.id)
            .single()
            .execute()
        )

        return {
            "id": user.id,
            "email": user.email,
            "user_metadata": {
                "role": profile_result.data.get("role"),
                "tenant_id": profile_result.data.get("tenant_id"),
            },
        }
    except Exception as e:
        raise HTTPException(
            status_code=401, detail=f"Authentication failed: {str(e)}"
        ) from e


async def get_current_admin(request: Request):
    user = await get_current_user(request)

    if user["user_metadata"].get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    return user
