import math
import time
import os

import cStringIO
import dropbox
import requests
from PIL import Image

# CA only
lower_left = (-2465981, 1185123)  # Lon/Lat(-122.1233,30.6723)
upper_right = (-1641691, 2492832)  # Lon/Lat(-116.6495,43.8157)

USDA_BASE_URL = "https://nassgeodata.gmu.edu/axis2/services/CDLService/GetCDLFile?year=2016&bbox="

# write header
out_file_name = 'pyf_test_agged.csv'
with open(out_file_name, 'w') as f:
    f.write("x,y,type,ct\n")

en = 0
data_en = 0
done_boxes = set()

with open(out_file_name, 'a') as fa:
    start_time = time.time()
    paging = 50000
    total_n = int(
        math.ceil(abs(lower_left[0] - upper_right[0]) / float(paging)) * math.ceil(
            abs(lower_left[1] - upper_right[1]) / float(paging))
    )

    # tesselate the box
    for x_i in range(lower_left[0], upper_right[0], paging):
        for y_i in range(lower_left[1], upper_right[1], paging):
            bbox_q = ",".join([str(i) for i in [x_i, y_i, x_i + paging, y_i + paging]])

            status = ""
            if bbox_q in done_boxes:
                continue
            else:
                # get the data file link
                resp = requests.get(USDA_BASE_URL + bbox_q, verify=False)
                if "<returnURL>" in resp.text:
                    tiff_link = resp.text.split("<returnURL>")[-1].split("</returnURL>")[0]

                    # get the tiff file, do a histogram
                    img_resp = requests.get(tiff_link, verify=False)
                    img_file = cStringIO.StringIO(img_resp.content)
                    img = Image.open(img_file)

                    str_to_write_to_file = ""
                    for v, ct in enumerate(img.histogram()[1:]):
                        str_to_write_to_file += "{},{},{},{}\n".format(x_i, y_i, v, ct)
                    fa.write(str_to_write_to_file)

                    status = "got data"
                    data_en += 1

                else:
                    status = "no data"
                done_boxes.add(bbox_q)

            en += 1
            elapsed_seconds = int(time.time() - start_time)
            predicted_total_mins = "NaN"
            if data_en:
                predicted_total_mins = int(total_n / float(data_en) * elapsed_seconds) / 60
            print("DONE WITH {}/{} ({}%), {} secs / {} mins  {}".format(
                en, total_n, 100 * en / total_n, elapsed_seconds, predicted_total_mins, status)
            )

            if data_en > 3:
                break
        if data_en > 3:
            break

# upload file to dropbox
print("Uploading to Dropbox")
client = dropbox.client.DropboxClient(os.environ['DROPBOX_AUTH_TOKEN'])
with open(out_file_name, 'r') as fr:
    response = client.put_file('/'+out_file_name, fr)
