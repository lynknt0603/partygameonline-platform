# Night of Bloodlines — asset mapping

Source (read-only): `D:\night of bloodline`  
Runtime: `apps/web/public/assets/games/nob/`  
Copied as PNG (no ImageMagick; original files were not modified).

## Inventory

| Kind | Expected | Found |
| --- | --- | --- |
| Shadow Stalker | 6 | 6 |
| Blood Seer | 6 | 6 |
| Shapeshifter | 6 | 6 (`Shape_shifter_5.jpg` converted to PNG) |
| Feral Killer | 6 | 6 |
| Hunter | 6 | 6 |
| Special | 3 | 3 |
| Vampire ranks | 5 | 5 |
| Werewolf ranks | 5 | 5 |
| Halfblood | 1 | 1 |
| Moon Mark | sheet | sheet + cropped 2/3/4 |
| Visual identity | 1 | 1 |
| Master template | 1 | present, **not copied** (not gameplay) |
| Set sheets | 2 | present, **not copied** (reference only) |
| Card back | 1 | `back_role_system.png` → `cards/card-back.png` |

## Card mapping

| cardCode | source | runtime |
| --- | --- | --- |
| NOB-SS-01 | `02_Role_System/Shadow_Stalker/Shadow_Stalker_01_Rooftop_Watcher.png` | `cards/NOB-SS-01.png` |
| NOB-SS-02 | `.../Shadow_Stalker_02_Gargoyle_Watch.png` | `cards/NOB-SS-02.png` |
| NOB-SS-03 | `.../Shadow_Stalker_03_Bell_Tower_Spy.png` | `cards/NOB-SS-03.png` |
| NOB-SS-04 | `.../Shadow_Stalker_04_Window_Observer.png` | `cards/NOB-SS-04.png` |
| NOB-SS-05 | `.../Shadow_Stalker_05_Masquerade_Observer.png` | `cards/NOB-SS-05.png` |
| NOB-SS-06 | `.../Shadow_Stalker_06_Eclipse_City_Watcher.png` | `cards/NOB-SS-06.png` |
| NOB-BS-01..06 | `Blood_Seer/Blood_Seer_1.png` … `_6.png` | `cards/NOB-BS-0N.png` |
| NOB-SH-01..06 | `Shape_Shifter/Shape_shifter_1.png` … `_6.png` (5 is `.jpg`) | `cards/NOB-SH-0N.png` |
| NOB-FK-01..06 | `Feral Killer/Feral_Killer_1.png` … `_6.png` | `cards/NOB-FK-0N.png` |
| NOB-HU-01..06 | `Hunter/Hunter_1.png` … `_6.png` | `cards/NOB-HU-0N.png` |
| NOB-SP-VEIL-REVERSAL | `Special Card/Veil_Reversal.png` | `cards/NOB-SP-VEIL-REVERSAL.png` |
| NOB-SP-LAST-OFFERING | `Special Card/Glorious_Sacrifice.png` | `cards/NOB-SP-LAST-OFFERING.png` |
| NOB-SP-LAST-HOPE | `Special Card/Last_Hope.png` | `cards/NOB-SP-LAST-HOPE.png` |

`cardCode ≠ filename` is intentional for Last Offering → Glorious Sacrifice.

## Bloodlines

| Backend | runtime |
| --- | --- |
| VAMPIRE + rank 1–5 | `bloodlines/vampire-0N.png` |
| WEREWOLF + rank 1–5 | `bloodlines/werewolf-0N.png` |
| HALFBLOOD (no rank) | `bloodlines/halfblood.png` |

## Card back

| source | runtime |
| --- | --- |
| `D:\night of bloodline\back_role_system.png` | `cards/card-back.png` |

Used for every face-down role card (`NobCard face="down"`). Missing file falls back to CSS placeholder.

## Moon Mark

Source is a **sheet** (`Moonmask_token.png`), not three files. Cropped copies: `tokens/moon-mark-2.png` / `3` / `4`. Sheet also copied as `moon-mark-sheet.png` for reference.

UI terminology: **Moon Mark** (not Moonmask).

## Not used at runtime

- `Master_Role_Card_Template.png`
- Vampire / Werewolf set sheets
- Visual identity is branding only (`branding/visual-identity.png`)
