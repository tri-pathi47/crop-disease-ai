# Design decisions

Short notes on choices that are easy to reverse by accident.

**The model must be able to say "healthy."**
An early version had no healthy outcome, so a photo of a perfectly fine plant
came back as "fungal leaf disease, high confidence." Any scoring change must keep
`healthy` as a candidate in `scoring.py`.

**Necrotic tissue sits outside the green hue band.**
Segmentation originally built its analysis region from the green vegetation mask,
which excluded the brown lesions it was looking for and reported ~0% affected
area on visibly diseased leaves. The region is now healthy ∪ yellowed ∪ necrotic.

**Farmers type Indian languages in Latin script.**
Query routing matches both "खेत" and "khet", "मिट्टी" and "mitti". Keyword lists
in `rag.py` must carry both spellings.

**Confidence is a function of evidence, not of model certainty.**
Views sent × photo quality × margin between the top two causes. One blurry photo
can never produce high confidence, regardless of how clear the symptom looks.

**Weather is context, never a diagnosis.**
It shifts risk. `weather.fetch()` returns a degraded payload rather than raising,
so a forecast outage cannot block an assessment.

**Satellite tells you where, not what.**
Zone indices direct the farmer's walk. Any copy claiming otherwise is wrong.

**No chemical recommendations.**
Product choice depends on state registration, crop stage and pre-harvest
interval. The app routes to a KVK or plant clinic.
