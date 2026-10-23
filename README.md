# BN Shortener MCP server

Lets AI assistants work with your [BN Shortener](https://b1.lc) account: create and change short links, read
click statistics, run Launch Check before a campaign, see links that need attention, make QR codes and bio pages.

## Hosted (recommended)

Add `https://b1.lc/mcp` as a remote MCP server / custom connector. You sign in to BN Shortener and choose what the
assistant may do; disconnect it any time in **Settings → Security → Connected Apps**.

- Claude (claude.ai, desktop): Settings → Connectors → Add custom connector → `https://b1.lc/mcp`
- Claude Code: `claude mcp add --transport http bn-shortener https://b1.lc/mcp`
- VS Code / Cursor and others: a server of type `http` with URL `https://b1.lc/mcp`

## Local (stdio), for clients that only start local servers

```json
{
  "mcpServers": {
    "bn-shortener": {
      "command": "npx",
      "args": ["-y", "@broadnet/shortener-mcp"],
      "env": { "BN_API_KEY": "bn_live_..." }
    }
  }
}
```

It forwards to the hosted server with the API key (dashboard: **API Portal → API keys**); the key's permissions
decide what the assistant can do. Node 20+.

## Tools

create_link, list_links, get_link, update_link, archive_link, delete_link (to Trash, 30 days), get_link_stats,
bulk_create_links, run_launch_check, get_link_health, check_url_safety, create_qr_code (returns the image),
list_qr_codes, get_qr_code_image, get_qr_code_stats, create_bio_page, add_bio_page_link, list_bio_pages,
get_account_usage, list_campaigns, create_campaign, add_links_to_campaign, get_campaign_stats, list_utm_presets,
add_smart_rule, start_ab_test, get_ab_test_results,
list_domains.

## License

MIT
