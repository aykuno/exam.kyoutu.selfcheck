from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import json

out = Path("audit/photo-live/output")
out.mkdir(parents=True, exist_ok=True)
font_path = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"
font = ImageFont.truetype(font_path, 42)
small = ImageFont.truetype(font_path, 34)
title = ImageFont.truetype(font_path, 60)
cases = []

def make(name, subject, tokens, values, labels, rotate=0):
    width = max(1400, 300 + len(tokens) * 88)
    height = 340 + len(values) * 98
    image = Image.new("RGB", (width, height), "white")
    d = ImageDraw.Draw(image)
    d.text((70,35), subject + " 読取検証用", fill="black", font=title)
    d.text((70,135), "第1問", fill="black", font=font)
    for col, token in enumerate(tokens):
        x=250+col*88
        d.text((x,220),token,fill="black",font=small,anchor="mm")
    for row,(value,label) in enumerate(zip(values,labels)):
        y=305+row*98
        d.text((90,y),label,fill="black",font=font,anchor="lm")
        d.line((55,y+45,width-60,y+45),fill=(175,175,175),width=2)
        for col,token in enumerate(tokens):
            x=250+col*88
            d.ellipse((x-25,y-25,x+25,y+25),outline="black",width=3)
            if token==value:
                d.ellipse((x-20,y-20,x+20,y+20),fill=(45,45,45))
    if rotate:
        image=image.rotate(rotate,expand=True,fillcolor="white")
    path=out/(name+".jpg")
    image.save(path,quality=94)
    cases.append({"name":name,"subject":subject,"path":str(path),
                  "labels":labels,"values":values})

make("numbers", "国語", [str(i) for i in range(10)],
     ["0","3","9","1","7","4","2","8","5","6","","3"],
     [str(i) for i in range(1,13)])
make("minus", "数学", ["−"]+[str(i) for i in range(10)],
     ["−","0","7","2","9","−","4","1","","6"],
     list("アイウエオカキクケコ"))
make("letters_rotated", "情報", [str(i) for i in range(10)]+list("abcdef"),
     ["a","f","0","7","c","9","b","e","","d"],
     list("アイウエオカキクケコ"),rotate=90)
(out/"fixtures.json").write_text(json.dumps(cases,ensure_ascii=False,indent=2))
