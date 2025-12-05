# OpenAI Configuration Setup

## Environment Variables Required

Add the following to your `.env.local` file:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key
```

## How to Get Your OpenAI API Key

1. Go to [https://platform.openai.com](https://platform.openai.com)
2. Sign in or create an account
3. Navigate to **API Keys** section
4. Click **Create new secret key**
5. Copy the key and paste it as `OPENAI_API_KEY`
6. **Important**: Store this key securely - you won't be able to see it again!

## API Usage & Models

TechCareer.AI uses OpenAI's GPT-4o model for:

- **CV Analysis**: Comprehensive career insights and recommendations
- **Job Matching**: Intelligent compatibility analysis
- **Metadata Extraction**: Structured data parsing from CV text
- **Career Guidance**: Personalized advice and suggestions

### Rate Limits & Costs

- **Free Tier**: 3 requests per minute
- **Pro Tier**: 10 requests per minute
- **Cost**: ~$0.03 per CV analysis, ~$0.02 per job match

### Model Configuration

The system uses the following models:
- **Primary**: `gpt-4o` for analysis tasks
- **Fallback**: `gpt-4o-mini` for cost optimization
- **Temperature**: 0.3 for consistent, factual responses

## Testing OpenAI Integration

After setting up your API key:

1. **Test the connection**:
   ```bash
   npm run test:openai
   ```

2. **Verify API calls** in development:
   - Upload a CV and check the analysis
   - Try job matching functionality
   - Monitor API usage in OpenAI dashboard

## Troubleshooting

### Common Issues

**Invalid API Key:**
```bash
# Check your key format
echo $OPENAI_API_KEY | head -c 10
# Should start with 'sk-'
```

**Rate Limit Exceeded:**
- Free accounts: 3 RPM
- Paid accounts: Higher limits based on usage tier
- Implement exponential backoff for retries

**Model Not Available:**
- Ensure you have access to GPT-4o
- Check your OpenAI account tier
- Fallback to GPT-4o-mini if needed

**Cost Monitoring:**
```bash
# Check usage in OpenAI dashboard
# Monitor spending limits
# Set up billing alerts
```

### Error Handling

The application includes comprehensive error handling for:

- **Network failures**: Automatic retry with exponential backoff
- **API errors**: Graceful degradation to cached results
- **Rate limits**: Queue management and user notifications
- **Invalid responses**: Fallback parsing and error reporting

### Security Best Practices

- **Never expose API keys** in client-side code
- **Rotate keys regularly** for security
- **Monitor usage** to prevent unexpected costs
- **Use environment variables** for all secrets

## Support

For OpenAI-specific issues:
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [OpenAI Status Page](https://status.openai.com)
- [OpenAI Community Forum](https://community.openai.com)

For application integration issues:
- Check application logs for detailed error messages
- Verify API key permissions and billing status
- Test with OpenAI's API playground first
