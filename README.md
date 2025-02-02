[![CI Test Status][ci-img]][ci-url]
[![Code Climate][clim-img]][clim-url]

# haraka-plugin-early_talker

Early talkers are violators of the SMTP specification, which require that
clients must wait for certain responses before sending the next command.

This plugin introduces a configurable delay before the connection banner
and after the DATA command for Haraka to detect if it talks early.

If an early talker is detected at connection or DATA, then a DENY is
returned with the message 'You talk too soon'.

## Configuration

The config file early_talker.ini has two options:

- pause: the delay in seconds before each SMTP command. Default is no pause.

- reject: whether or not to reject for early talkers. Default is true;

- [ip_whitelist]: list of IP addresses and/or subnets to whitelist

[ci-img]: https://github.com/haraka/haraka-plugin-early_talker/actions/workflows/ci.yml/badge.svg
[ci-url]: https://github.com/haraka/haraka-plugin-early_talker/actions/workflows/ci.yml
[clim-img]: https://codeclimate.com/github/haraka/haraka-plugin-early_talker/badges/gpa.svg
[clim-url]: https://codeclimate.com/github/haraka/haraka-plugin-early_talker
