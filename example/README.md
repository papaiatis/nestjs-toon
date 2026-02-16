# nestjs-toon Example Application

This example demonstrates how to use the nestjs-toon library to add TOON serialization support to your NestJS application.

## Setup

```bash
cd example
npm install
npm start
```

The server will start on `http://localhost:3000`.

## Available Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/hikes` | Returns an array of hiking data (demonstrates TOON's strength with uniform objects) |
| GET | `/api/users` | Returns an array of 10 user objects |
| GET | `/api/mixed` | Returns a mixed structure with nested objects and arrays |

## Testing with cURL

### Get TOON Response
```bash
curl -H "Accept: text/toon" http://localhost:3000/api/hikes
```

**Response:**
```
hikes[3]{id,distanceKm,elevationGain,name,companion,wasSunny}:
1,7.5,320,Blue Lake Trail,ana,true
2,9.2,540,Ridge Overlook,luis,false
3,5.1,180,Wildflower Loop,sam,true
```

### Get JSON Response (default)
```bash
curl -H "Accept: application/json" http://localhost:3000/api/hikes
```

**Response:**
```json
{
  "hikes": [
    {
      "id": 1,
      "name": "Blue Lake Trail",
      "distanceKm": 7.5,
      "elevationGain": 320,
      "companion": "ana",
      "wasSunny": true
    },
    ...
  ]
}
```

### Test with Wildcard Accept Header
```bash
curl -H "Accept: */*" http://localhost:3000/api/users
```

This will return TOON format because wildcards match text/toon.

## Configuration

The example uses global TOON configuration in `src/app.module.ts`:

```typescript
ToonModule.forRoot({
  global: true,
  enableResponseSerialization: true,
  errorHandling: 'log-and-fallback',
})
```

## Token Comparison

### JSON (3 hikes): ~280 tokens
```json
{"hikes":[{"id":1,"name":"Blue Lake Trail","distanceKm":7.5,"elevationGain":320,"companion":"ana","wasSunny":true},{"id":2,"name":"Ridge Overlook","distanceKm":9.2,"elevationGain":540,"companion":"luis","wasSunny":false},{"id":3,"name":"Wildflower Loop","distanceKm":5.1,"elevationGain":180,"companion":"sam","wasSunny":true}]}
```

### TOON (3 hikes): ~120 tokens (57% reduction)
```
hikes[3]{id,distanceKm,elevationGain,name,companion,wasSunny}:
1,7.5,320,Blue Lake Trail,ana,true
2,9.2,540,Ridge Overlook,luis,false
3,5.1,180,Wildflower Loop,sam,true
```

## Next Steps

1. Try different Accept headers
2. Compare response sizes between JSON and TOON
3. Test error handling by modifying the code to throw errors
4. Experiment with custom content types in configuration
