from openai import OpenAI

# TODO: Implement with OpenAI Agent
client = OpenAI()

response = client.responses.create(
    model="gpt-4.1",
    input=[
        {
            "role": "user",
            "content": [
                { "type": "input_text", "text": "what is the approx calorie in this image?" },
                {
                    "type": "input_image",
                    "image_url": "https://www.nhlbi.nih.gov/sites/default/files/styles/16x9_crop/public/2025-03/Ultraprocessed%20foods%20display%202%20framed%20-%20shutterstock_2137640529_r.jpg?h=ab94ba44&itok=yrOIN-8T"
                }
            ]
        }
    ]
)

print(response)