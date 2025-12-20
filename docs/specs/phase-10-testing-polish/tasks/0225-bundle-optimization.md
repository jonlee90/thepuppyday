# Task 0225: Configure code splitting and bundle optimization

**Phase**: 10.1 Performance
**Prerequisites**: None
**Estimated effort**: 2-3 hours

## Objective

Configure webpack and Next.js for optimal code splitting and bundle size management.

## Requirements

- Add @next/bundle-analyzer to dev dependencies
- Configure webpack splitChunks in next.config.mjs
- Add optimizePackageImports for lucide-react, framer-motion, @supabase/supabase-js
- Ensure no chunk larger than 250KB gzipped

## Acceptance Criteria

- [ ] Bundle analyzer installed and configured
- [ ] webpack splitChunks configured
- [ ] optimizePackageImports configured for heavy libraries
- [ ] Bundle analysis shows no chunk > 250KB gzipped
- [ ] Common vendor chunks properly separated
- [ ] Route chunks properly isolated

## Implementation Details

### Files to Modify

- `package.json` - Add @next/bundle-analyzer
- `next.config.mjs` - Configure webpack and optimization

### Configuration Example

```javascript
experimental: {
  optimizePackageImports: [
    'lucide-react',
    'framer-motion',
    '@supabase/supabase-js'
  ]
}
```

### Commands to Add

```json
"analyze": "ANALYZE=true next build",
"analyze:server": "BUNDLE_ANALYZE=server next build",
"analyze:browser": "BUNDLE_ANALYZE=browser next build"
```

## References

- **Requirements**: Req 3.1-3.3
- **Design**: Section 10.1.3
