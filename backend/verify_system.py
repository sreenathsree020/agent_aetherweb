import asyncio
import httpx
from app.main import app

async def test_app():
    print("Testing FastAPI app integration with httpx.ASGITransport...")
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Health check
        h_res = await client.get("/health")
        print(f"1. /health -> HTTP {h_res.status_code}: {h_res.json()}")
        assert h_res.status_code == 200

        # 2. Root serving React SPA
        root_res = await client.get("/")
        print(f"2. / -> HTTP {root_res.status_code} (Length: {len(root_res.text)} bytes)")
        assert "VoiceAgent Studio" in root_res.text or "vite" in root_res.text or root_res.status_code == 200

        # 3. Workflows API
        wf_res = await client.get("/api/v1/workflows")
        print(f"3. /api/v1/workflows -> HTTP {wf_res.status_code}: {len(wf_res.json().get('nodes', []))} nodes")
        assert wf_res.status_code == 200
        assert len(wf_res.json().get("nodes", [])) >= 2

        # 4. Addons API
        addons_res = await client.get("/api/v1/addons")
        print(f"4. /api/v1/addons -> HTTP {addons_res.status_code}: {addons_res.json()}")
        assert addons_res.status_code == 200

        # 5. Database Addon Test Endpoint (testing local sandbox sqlite)
        db_payload = {
            "engine": "sqlite",
            "host": "localhost",
            "port": 5432,
            "database": "voice_agent.db",
            "username": "test",
            "query_template": "SELECT 1 as connected, 'Order #9821 Shipped' as status, :caller_phone as phone",
            "sample_phone": "+1-800-DEMO-CALLER"
        }
        db_res = await client.post("/api/v1/addons/database/test", json=db_payload)
        print(f"5. /api/v1/addons/database/test -> HTTP {db_res.status_code}: {db_res.json()}")
        assert db_res.status_code == 200
        assert db_res.json().get("success") is True

    print("\nALL 5 SYSTEM VERIFICATION CHECKS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(test_app())
