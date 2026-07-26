#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "pyttsx3",
# ]
# ///

import argparse
import json
import random
import subprocess
import sys


def get_notification_message(notification_type="default"):
    """Get appropriate message based on notification type."""
    messages = {
        "subagent": [
            "¡Subagent finished! ¡Su su su!",
        ],
        "task": [
            "¡Task completed! ¡Go go go!",
        ],
        "default": [
            "Agente esperando tu respuesta",
            "Notificación del agente",
            "Claude necesita tu atención",
            "Se requiere tu intervención",
        ],
    }

    message_list = messages.get(notification_type, messages["default"])
    return random.choice(message_list)


def play_notification_sound(notification_type="default", debug=False):
    """Play a TTS notification based on the type of completion."""
    try:
        message = get_notification_message(notification_type)

        if debug:
            print(f"🎯 Message: {message}")
            print(f"🔊 Playing {notification_type} notification...")

        # Try eSpeak first (we know it works in WSL2)
        if use_espeak_tts(message, debug):
            return True

        # Fallback to pyttsx3
        if use_pyttsx3_tts(message, debug):
            return True

        # Ultimate fallback: terminal bell
        if debug:
            print("🔔 Using terminal bell fallback...")
        print("\a", end="", flush=True)
        return True

    except Exception as e:
        if debug:
            print(f"❌ Error: {e}")
        # Even if everything fails, at least try the bell
        try:
            print("\a", end="", flush=True)
            return True
        except Exception:
            return False


def use_pyttsx3_tts(text, debug=False):
    """Try to use pyttsx3 for TTS."""
    try:
        import pyttsx3

        if debug:
            print("🎙️ Trying pyttsx3...")

        # Initialize TTS engine
        engine = pyttsx3.init()

        # Get available voices and try to set a working one
        voices = engine.getProperty("voices")
        if voices:
            for voice in voices:
                if voice and hasattr(voice, "id"):
                    try:
                        engine.setProperty("voice", voice.id)
                        break
                    except Exception:
                        continue

        # Configure engine settings
        try:
            engine.setProperty("rate", 180)  # Speech rate
            engine.setProperty("volume", 1.0)  # Maximum volume
        except Exception:
            pass  # Continue with default settings

        # Speak the text
        engine.say(text)
        engine.runAndWait()

        if debug:
            print("✅ pyttsx3 success!")
        return True

    except ImportError:
        if debug:
            print("❌ pyttsx3 not available")
        return False
    except Exception as e:
        if debug:
            print(f"❌ pyttsx3 error: {e}")
        return False


def use_espeak_tts(text, debug=False):
    """Use eSpeak for TTS."""
    try:
        if debug:
            print("🎙️ Using eSpeak...")

        # Use eSpeak with maximum volume
        result = subprocess.run(
            ["espeak", "-a", "300", "-s", "150", text], capture_output=True, timeout=10
        )

        if result.returncode == 0:
            if debug:
                print("✅ eSpeak success!")
            return True
        else:
            if debug:
                print(f"⚠️ eSpeak warning: return code {result.returncode}")
            return False

    except subprocess.TimeoutExpired:
        if debug:
            print("⚠️ eSpeak timeout")
        return False
    except FileNotFoundError:
        if debug:
            print("❌ eSpeak not found - install: sudo apt install espeak")
        return False
    except subprocess.SubprocessError as e:
        if debug:
            print(f"❌ eSpeak subprocess error: {e}")
        return False
    except Exception as e:
        if debug:
            print(f"❌ eSpeak error: {e}")
        return False


def should_play_notification(input_data):
    """Determine if we should play a notification based on the input data."""
    if not input_data:
        return True

    message = input_data.get("message", "").lower()

    # Skip the generic waiting message
    return message != "claude is waiting for your input"


def main():
    try:
        # Parse command line arguments
        parser = argparse.ArgumentParser(description="Simple audio notification for Claude hooks")
        parser.add_argument(
            "--notify", action="store_true", help="Enable audio notifications (default behavior)"
        )
        parser.add_argument("--silent", action="store_true", help="Disable audio notifications")
        parser.add_argument(
            "--type",
            choices=["subagent", "task", "default"],
            default="default",
            help=(
                "Type of notification: 'subagent' for subagent completion, "
                "'task' for task completion, 'default' for general notifications"
            ),
        )
        parser.add_argument("--debug", action="store_true", help="Enable debug output")
        args = parser.parse_args()

        # Read JSON input from stdin if available
        input_data = None
        try:
            if not sys.stdin.isatty():  # Check if there's piped input
                stdin_content = sys.stdin.read().strip()
                if stdin_content:
                    input_data = json.loads(stdin_content)
        except (json.JSONDecodeError, ValueError):
            # If JSON parsing fails, still continue with notification
            pass

        # Play notification unless explicitly silenced
        if not args.silent and should_play_notification(input_data):
            success = play_notification_sound(args.type, args.debug)
            if not success and args.debug:
                print("Warning: Could not play notification sound", file=sys.stderr)

        sys.exit(0)

    except Exception as e:
        # Fail gracefully
        print(f"Error in audio notification: {e}", file=sys.stderr)
        sys.exit(0)


if __name__ == "__main__":
    main()
