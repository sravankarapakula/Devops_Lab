const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function verify() {
    const url = "http://127.0.0.1:3000/status";

    for (let attempt = 1; attempt <= 15; attempt++) {
        try {
            const response = await fetch(url);
            const body = await response.json();

            if (
                response.status === 200 &&
                typeof body.status === "string" &&
                body.status.trim().length > 0
            ) {
                console.log("API verification successful.");
                console.log(JSON.stringify(body));
                return;
            }

            console.error("Unexpected API response:", body);
        } catch (error) {
            console.log(`Attempt ${attempt}/15: API not ready yet.`);
        }

        if (attempt < 15) {
            await sleep(2000);
        }
    }

    console.error("API verification failed after 15 attempts.");
    process.exitCode = 1;
}

verify();
