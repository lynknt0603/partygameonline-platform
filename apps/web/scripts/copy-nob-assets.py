"""Copy Night of Bloodlines artwork into FE public/. Source dir is never modified."""
from __future__ import print_function

import os
import shutil

from PIL import Image

SRC = r"D:\night of bloodline"
DST = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "public", "assets", "games", "nob")
)

CARD_MAP = [
    ("NOB-SS-01", r"02_Role_System\Shadow_Stalker\Shadow_Stalker_01_Rooftop_Watcher.png"),
    ("NOB-SS-02", r"02_Role_System\Shadow_Stalker\Shadow_Stalker_02_Gargoyle_Watch.png"),
    ("NOB-SS-03", r"02_Role_System\Shadow_Stalker\Shadow_Stalker_03_Bell_Tower_Spy.png"),
    ("NOB-SS-04", r"02_Role_System\Shadow_Stalker\Shadow_Stalker_04_Window_Observer.png"),
    ("NOB-SS-05", r"02_Role_System\Shadow_Stalker\Shadow_Stalker_05_Masquerade_Observer.png"),
    ("NOB-SS-06", r"02_Role_System\Shadow_Stalker\Shadow_Stalker_06_Eclipse_City_Watcher.png"),
    ("NOB-BS-01", r"02_Role_System\Blood_Seer\Blood_Seer_1.png"),
    ("NOB-BS-02", r"02_Role_System\Blood_Seer\Blood_Seer_2.png"),
    ("NOB-BS-03", r"02_Role_System\Blood_Seer\Blood_Seer_3.png"),
    ("NOB-BS-04", r"02_Role_System\Blood_Seer\Blood_Seer_4.png"),
    ("NOB-BS-05", r"02_Role_System\Blood_Seer\Blood_Seer_5.png"),
    ("NOB-BS-06", r"02_Role_System\Blood_Seer\Blood_Seer_6.png"),
    ("NOB-SH-01", r"02_Role_System\Shape_Shifter\Shape_shifter_1.png"),
    ("NOB-SH-02", r"02_Role_System\Shape_Shifter\Shape_shifter_2.png"),
    ("NOB-SH-03", r"02_Role_System\Shape_Shifter\Shape_shifter_3.png"),
    ("NOB-SH-04", r"02_Role_System\Shape_Shifter\Shape_shifter_4.png"),
    ("NOB-SH-05", r"02_Role_System\Shape_Shifter\Shape_shifter_5.jpg"),
    ("NOB-SH-06", r"02_Role_System\Shape_Shifter\Shape_shifter_6.png"),
    ("NOB-FK-01", r"02_Role_System\Feral Killer\Feral_Killer_1.png"),
    ("NOB-FK-02", r"02_Role_System\Feral Killer\Feral_Killer_2.png"),
    ("NOB-FK-03", r"02_Role_System\Feral Killer\Feral_Killer_3.png"),
    ("NOB-FK-04", r"02_Role_System\Feral Killer\Feral_Killer_4.png"),
    ("NOB-FK-05", r"02_Role_System\Feral Killer\Feral_Killer_5.png"),
    ("NOB-FK-06", r"02_Role_System\Feral Killer\Feral_Killer_6.png"),
    ("NOB-HU-01", r"02_Role_System\Hunter\Hunter_1.png"),
    ("NOB-HU-02", r"02_Role_System\Hunter\Hunter_2.png"),
    ("NOB-HU-03", r"02_Role_System\Hunter\Hunter_3.png"),
    ("NOB-HU-04", r"02_Role_System\Hunter\Hunter_4.png"),
    ("NOB-HU-05", r"02_Role_System\Hunter\Hunter_5.png"),
    ("NOB-HU-06", r"02_Role_System\Hunter\Hunter_6.png"),
    ("NOB-SP-VEIL-REVERSAL", r"02_Role_System\Special Card\Veil_Reversal.png"),
    ("NOB-SP-LAST-OFFERING", r"02_Role_System\Special Card\Glorious_Sacrifice.png"),
    ("NOB-SP-LAST-HOPE", r"02_Role_System\Special Card\Last_Hope.png"),
]

BLOODLINES = [
    ("vampire-01.png", r"01_Faction_Cards\Vampires\Vampires_Rank_1.png"),
    ("vampire-02.png", r"01_Faction_Cards\Vampires\Vampires_Rank_2.png"),
    ("vampire-03.png", r"01_Faction_Cards\Vampires\Vampires_Rank_3.png"),
    ("vampire-04.png", r"01_Faction_Cards\Vampires\Vampires_Rank_4.png"),
    ("vampire-05.png", r"01_Faction_Cards\Vampires\Vampires_Rank_5.png"),
    ("werewolf-01.png", r"01_Faction_Cards\Werewolves\Werewolves_Rank_1.png"),
    ("werewolf-02.png", r"01_Faction_Cards\Werewolves\Werewolves_Rank_2.png"),
    ("werewolf-03.png", r"01_Faction_Cards\Werewolves\Werewolves_Rank_3.png"),
    ("werewolf-04.png", r"01_Faction_Cards\Werewolves\Werewolves_Rank_4.png"),
    ("werewolf-05.png", r"01_Faction_Cards\Werewolves\Werewolves_Rank_5.png"),
    ("halfblood.png", r"01_Faction_Cards\Halfblood\Halfblood_Faction_Card.png"),
]


def copy_file(rel_src, dest):
    src = os.path.join(SRC, rel_src)
    if not os.path.isfile(src):
        raise SystemExit("MISSING SOURCE: " + src)
    parent = os.path.dirname(dest)
    if not os.path.isdir(parent):
        os.makedirs(parent)
    shutil.copy2(src, dest)
    print("OK", dest)


def crop_moon_marks(sheet_path, token_dir):
    im = Image.open(sheet_path).convert("RGB")
    w, h = im.size
    boxes = {
        2: (int(w * 0.32), int(h * 0.02), int(w * 0.68), int(h * 0.50)),
        3: (int(w * 0.04), int(h * 0.46), int(w * 0.46), int(h * 0.98)),
        4: (int(w * 0.54), int(h * 0.46), int(w * 0.96), int(h * 0.98)),
    }
    if not os.path.isdir(token_dir):
        os.makedirs(token_dir)
    for value, box in boxes.items():
        crop = im.crop(box)
        out = os.path.join(token_dir, "moon-mark-%d.png" % value)
        crop.save(out, "PNG")
        print("OK crop", out)


def main():
    cards_dir = os.path.join(DST, "cards")
    blood_dir = os.path.join(DST, "bloodlines")
    brand_dir = os.path.join(DST, "branding")
    token_dir = os.path.join(DST, "tokens")
    for folder in (cards_dir, blood_dir, brand_dir, token_dir):
        if not os.path.isdir(folder):
            os.makedirs(folder)

    for code, rel in CARD_MAP:
        dest = os.path.join(cards_dir, code + ".png")
        src = os.path.join(SRC, rel)
        if not os.path.isfile(src):
            raise SystemExit("MISSING SOURCE: " + src)
        parent = os.path.dirname(dest)
        if not os.path.isdir(parent):
            os.makedirs(parent)
        if rel.lower().endswith(".jpg") or rel.lower().endswith(".jpeg"):
            Image.open(src).convert("RGB").save(dest, "PNG")
            print("OK convert", dest)
        else:
            shutil.copy2(src, dest)
            print("OK", dest)

    for name, rel in BLOODLINES:
        copy_file(rel, os.path.join(blood_dir, name))

    copy_file(
        r"00_Visual_Identity\Night_of_Bloodlines_Visual_Identity_Board.png",
        os.path.join(brand_dir, "visual-identity.png"),
    )
    copy_file("Moonmask_token.png", os.path.join(token_dir, "moon-mark-sheet.png"))
    crop_moon_marks(os.path.join(SRC, "Moonmask_token.png"), token_dir)
    print("DONE", DST)


if __name__ == "__main__":
    main()
