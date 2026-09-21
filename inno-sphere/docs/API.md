# API reference

Base URL `http://localhost:8000`. Interactive docs at `/docs`.
All endpoints except `/health` and `/auth/*` require `Authorization: Bearer <token>`.

## Auth
| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/register` | Create a farmer account, returns a token |
| POST | `/auth/login` | Exchange phone + password for a token |
| GET | `/auth/me` | Current farmer profile |

## Farm and crop
| Method | Path | Purpose |
|---|---|---|
| GET / POST | `/farms` | List or create farms |
| PUT | `/farms/{farm_id}` | Update a farm |
| GET / POST | `/crops` | Crop cycles for a farm |
| GET | `/soil/{farm_id}` | Latest soil record |
| POST | `/soil` | Add a soil test |

## Photos and assessment
| Method | Path | Purpose |
|---|---|---|
| POST | `/images/upload` | Multipart upload. Runs the quality gate and returns a score, the specific issues, and a retake message in the farmer's language if unusable. |
| GET | `/images/{id}/evidence.png` | The photo with affected regions tinted |
| POST | `/diagnosis/analyse` | Multi-view assessment across the uploaded photos |
| GET | `/diagnosis/history/{crop_cycle_id}` | Every past assessment for this crop |

### `POST /diagnosis/analyse`

```json
{ "crop_cycle_id": 1, "image_ids": [4, 5, 6], "farmer_note": "lower leaves spotted" }
```

Returns the primary finding, the farmer-language explanation keyed by language,
the ranked differential, confidence, severity, the evidence list, the actions,
whether more evidence is needed, which photo to request next, and the sources.

## Context
| Method | Path | Purpose |
|---|---|---|
| GET | `/weather?lat=&lon=` | Live forecast with humid-night count and disease pressure |
| GET | `/satellite/{farm_id}` | Field zones, or a not-connected message |
| GET | `/alerts/{farm_id}` | Stored alerts plus live weather-derived ones |

## Assistant and knowledge
| Method | Path | Purpose |
|---|---|---|
| POST | `/chat` | Routed question answering with sources |
| GET | `/chat/history` | Conversation history |
| POST | `/voice/transcribe` · `/voice/speak` | Bhashini hooks |
| GET | `/knowledge/crops` · `/diseases` · `/pests` · `/glossary` | Knowledge base |
