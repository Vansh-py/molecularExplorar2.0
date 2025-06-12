api_key = "AIzaSyBR2e37RC4t5QNVkN9YtZoJXKsdvNQeU1A"
import os
import json
import google.generativeai as genai
from dotenv import load_dotenv


# Load environment variables
load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY") or 'AIzaSyCOI1Aj21qPxRtkvyD4GWGWoOS2EFp8fPE'
if not API_KEY or API_KEY == "":
    print("Error: Please set your Gemini API key")
    exit()
    
genai.configure(api_key=API_KEY)

def get_reaction_prediction(reactants: list, conditions: str = "standard conditions") -> dict:
    """
    Predict chemical reaction products from IUPAC names using Gemini API
    """
    model = genai.GenerativeModel('gemini-2.0-flash-lite')
    
    prompt = f"""As a chemistry expert, predict the reaction between these compounds:
Reactants: {", ".join(reactants)}
Conditions: {conditions}

Provide output as valid JSON with these exact keys:
- "reactants" (array of IUPAC names)
- "products" (array of IUPAC names)
- "balanced_equation" (string)
- "reaction_type" (string)
- "mechanism" (string)
- "notes" (array of strings)

If no reaction occurs, set "products" to empty array.
Use only proper IUPAC nomenclature."""

    try:
        response = model.generate_content(prompt)
        response_text = response.text
        
        # Clean the response (Gemini sometimes adds markdown backticks)
        response_text = response_text.replace('```json', '').replace('```', '').strip()
        
        return json.loads(response_text)
        
    except json.JSONDecodeError:
        return {"error": "Failed to parse response", "raw_response": response_text}
    except Exception as e:
        return {"error": f"Prediction failed: {str(e)}"}

def main():
    print("Chemical Reaction Predictor (IUPAC Names)")
    print("----------------------------------------")
    
    # Get user input
    reactants_input = input("Enter reactant IUPAC names (comma separated): ")
    reactants = [r.strip() for r in reactants_input.split(',') if r.strip()]
    
    if not reactants:
        print("Error: Please enter at least one reactant")
        return
        
    conditions = input("Enter conditions (press Enter for standard): ").strip()
    conditions = conditions if conditions else "standard conditions"
    
    # Get prediction
    result = get_reaction_prediction(reactants, conditions)
    
    # Display results
    print("\nReaction Prediction Results:")
    if "error" in result:
        print(f"Error: {result['error']}")
        if "raw_response" in result:
            print("\nRaw API Response:")
            print(result['raw_response'])
    else:
        # ANSI escape color codes (no external libraries needed)
        HEADER = '\033[95m'  # Magenta
        REACTANTS = '\033[94m'  # Blue
        PRODUCTS = '\033[92m'  # Green
        EQUATION = '\033[96m'  # Cyan
        TYPE = '\033[93m'  # Yellow
        MECHANISM = '\033[91m'  # Red
        NOTES = '\033[90m'  # Dark gray
        RESET = '\033[0m'  # Reset to default

        # Print formatted and color-coded output
        print(f"{HEADER}----------------------------------------{RESET}")
        print(f"{REACTANTS}Reactants: {', '.join(result['reactants'])}{RESET}")
        print(f"{HEADER}----------------------------------------{RESET}")
        print(f"{PRODUCTS}Products: {', '.join(result['products']) if result['products'] else 'No reaction'}{RESET}")
        print(f"{HEADER}----------------------------------------{RESET}")
        print(f"\n{EQUATION}Balanced Equation: {result['balanced_equation']}{RESET}")
        print(f"{HEADER}----------------------------------------{RESET}")
        print(f"{TYPE}Reaction Type: {result['reaction_type']}{RESET}")
        print(f"{HEADER}----------------------------------------{RESET}")
        print(f"\n{MECHANISM}Mechanism: {result['mechanism']}{RESET}")
        print(f"{HEADER}----------------------------------------{RESET}")

        if result['notes']:
            print(f"\n{NOTES}Notes:{RESET}")
            print(f"{HEADER}----------------------------------------{RESET}")
            for note in result['notes']:
                print(f"{NOTES}- {note}{RESET}")


if __name__ == "__main__":
    main()