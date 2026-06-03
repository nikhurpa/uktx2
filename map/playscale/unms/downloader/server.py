from flask import Flask, Response, send_from_directory, jsonify
import subprocess
import sys
import os

app = Flask(__name__, static_folder="static")

SCRIPT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "main1.py")
running_process = None


@app.route("/")
def index():
    return send_from_directory("static", "index.html")


@app.route("/run", methods=["GET", "POST"])
def run_script():
    global running_process

    if not os.path.exists(SCRIPT_PATH):
        def missing():
            yield f"data: [ERROR] Script not found: {SCRIPT_PATH}\n\n"
            yield "data: __END__\n\n"
        return Response(missing(), mimetype="text/event-stream",
                        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

    def generate():
        global running_process
        try:
            running_process = subprocess.Popen(
                [sys.executable, "-u", SCRIPT_PATH],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                bufsize=1,
                text=True,
                encoding="utf-8",
                errors="replace",
                cwd=os.path.dirname(SCRIPT_PATH),
            )

            for line in iter(running_process.stdout.readline, ""):
                line = line.rstrip("\n").rstrip("\r")
                if line:
                    yield f"data: {line}\n\n"

            running_process.stdout.close()
            running_process.wait()
            code = running_process.returncode

            if code == 0:
                yield "data: [DONE] Process completed successfully.\n\n"
            else:
                yield f"data: [ERROR] Process exited with code {code}\n\n"

        except Exception as e:
            yield f"data: [ERROR] {str(e)}\n\n"
        finally:
            running_process = None
            yield "data: __END__\n\n"

    return Response(generate(), mimetype="text/event-stream",
                    headers={
                        "Cache-Control": "no-cache",
                        "X-Accel-Buffering": "no",
                        "Connection": "keep-alive",
                        "Access-Control-Allow-Origin": "*",
                    })


@app.route("/stop", methods=["POST"])
def stop_script():
    global running_process
    if running_process and running_process.poll() is None:
        running_process.terminate()
        return jsonify({"status": "stopped"})
    return jsonify({"status": "not_running"})


@app.route("/status")
def status():
    global running_process
    is_running = running_process is not None and running_process.poll() is None
    return jsonify({"running": is_running})


@app.route("/test")
def test():
    return jsonify({"status": "ok", "script": SCRIPT_PATH,
                    "script_exists": os.path.exists(SCRIPT_PATH)})


if __name__ == "__main__":
    os.makedirs("static", exist_ok=True)
    print(f"Script path: {SCRIPT_PATH}")
    print(f"Script exists: {os.path.exists(SCRIPT_PATH)}")
    print("Server running at http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)
