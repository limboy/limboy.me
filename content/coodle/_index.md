+++
# A draft section is only loaded if the `--drafts` flag is passed to `zola build`, `zola serve` or `zola check`.

draft = false

# Used to sort pages by "date", "title, "weight", or "none". See below for more information.

sort_by = "date"

# Template to use to render this section page.

template = "coodle_index.html"

page_template = "coodle.html"

# This sets the number of pages to be displayed per paginated page.

# No pagination will happen if this isn't set or if the value is 0.

paginate_by = 0

# If set, this will be the path used by the paginated page. The page number will be appended after this path.

# The default is page/1.

paginate_path = "page"

# If set, there will pagination will happen in a reversed order.

paginate_reversed = false

# This determines whether to insert a link for each header like the ones you can see on this site if you hover over

# a header.

# The default template can be overridden by creating an `anchor-link.html` file in the `templates` directory.

# This value can be "left", "right" or "none".

insert_anchor_links = "none"

# If set to "true", the section pages will be in the search index. This is only used if

# `build_search_index` is set to "true" in the Zola configuration file.

in_search_index = false

# If set to "true", the section homepage is rendered.

# Useful when the section is used to organize pages (not used directly).

render = true

# If set to "true", the section will pass its pages on to the parent section. Defaults to `false`.

# Useful when the section shouldn't split up the parent section, like

# sections for each year under a posts section.

transparent = false

# Use aliases if you are moving content but want to redirect previous URLs to the

# current one. This takes an array of paths, not URLs.

aliases = []

# If set to "true", a feed file will be generated for this section at the

# section's root path. This is independent of the site-wide variable of the same

# name. The section feed will only include posts from that respective feed, and

# not from any other sections, including sub-sections under that section.

generate_feed = false

# Your own data.

[extra]
+++
